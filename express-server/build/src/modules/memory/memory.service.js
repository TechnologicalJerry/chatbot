"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const memory_model_1 = __importDefault(require("./memory.model"));
const appError_1 = __importDefault(require("../../errors/appError"));
const env_1 = __importDefault(require("../../config/env"));
const logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
const metrics_1 = require("../../infrastructure/metrics/metrics");
class MemoryService {
    static SENSITIVE_KEYWORDS = [
        "password",
        "passwd",
        "secret",
        "api_key",
        "apikey",
        "token",
        "bearer",
        "private_key",
        "credit_card",
        "ssn",
    ];
    static async getActiveUserMemories(userId, limit = 20, type) {
        const query = { userId, status: "active" };
        if (type) {
            query.type = type;
        }
        return memory_model_1.default.find(query).sort({ updatedAt: -1 }).limit(limit);
    }
    static async deleteUserMemory(userId, memoryId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(memoryId)) {
            throw appError_1.default.notFound("Memory item not found");
        }
        const memory = await memory_model_1.default.findOne({ _id: memoryId, userId });
        if (!memory) {
            throw appError_1.default.notFound("Memory item not found");
        }
        if (memory.status === "deleted") {
            return true;
        }
        memory.status = "deleted";
        await memory.save();
        metrics_1.memoryDeletedCounter.inc();
        logger_1.default.info({ userId, memoryId }, "User memory soft-deleted");
        return true;
    }
    static async extractAndStoreMemories(userId, conversationId, userContent, assistantContent) {
        const lowerUserContent = userContent.toLowerCase();
        for (const keyword of MemoryService.SENSITIVE_KEYWORDS) {
            if (lowerUserContent.includes(keyword)) {
                logger_1.default.info({ userId, keyword }, "Memory extraction skipped due to sensitive keyword detection");
                metrics_1.memoryExtractionCounter.inc({ status: "filtered" });
                return [];
            }
        }
        const extractedCandidates = MemoryService.detectMemoryCandidates(userContent, conversationId);
        if (extractedCandidates.length === 0) {
            metrics_1.memoryExtractionCounter.inc({ status: "none" });
            return [];
        }
        const savedMemories = [];
        for (const candidate of extractedCandidates) {
            if (candidate.confidence < env_1.default.AI_MEMORY_CONFIDENCE_THRESHOLD) {
                continue;
            }
            const existing = await memory_model_1.default.findOne({
                userId,
                type: candidate.type,
                key: candidate.key,
                status: "active",
            });
            if (existing) {
                if (existing.value === candidate.value) {
                    continue;
                }
                existing.status = "superseded";
                await existing.save();
                metrics_1.memoryUpdatedCounter.inc();
            }
            const newMemory = await memory_model_1.default.create({
                userId,
                conversationId,
                type: candidate.type,
                key: candidate.key,
                value: candidate.value,
                source: "conversation_extracted",
                confidence: candidate.confidence,
                status: "active",
            });
            metrics_1.memoryCreatedCounter.inc({ type: candidate.type });
            savedMemories.push(newMemory);
            logger_1.default.info({
                userId,
                memoryId: newMemory._id,
                type: candidate.type,
                key: candidate.key,
            }, "New memory extracted and stored");
        }
        metrics_1.memoryExtractionCounter.inc({ status: "success" });
        return savedMemories;
    }
    static detectMemoryCandidates(text, conversationId) {
        const results = [];
        const lower = text.toLowerCase();
        if (lower.includes("i prefer ")) {
            const match = text.match(/i\s+prefer\s+([^.!?]+)/i);
            if (match && match[1].trim()) {
                const prefVal = match[1].trim();
                let key = "preference";
                if (prefVal.toLowerCase().includes("vegetarian") ||
                    prefVal.toLowerCase().includes("vegan") ||
                    prefVal.toLowerCase().includes("pescatarian")) {
                    key = "diet";
                }
                else if (prefVal.toLowerCase().includes("concise") ||
                    prefVal.toLowerCase().includes("brief") ||
                    prefVal.toLowerCase().includes("detailed")) {
                    key = "response_style";
                }
                results.push({
                    type: "preference",
                    key,
                    value: prefVal,
                    confidence: 0.9,
                });
            }
        }
        if (lower.includes("my goal is ")) {
            const match = text.match(/my\s+goal\s+is\s+([^.!?]+)/i);
            if (match && match[1].trim()) {
                results.push({
                    type: "goal",
                    key: "fitness_goal",
                    value: match[1].trim(),
                    confidence: 0.85,
                });
            }
        }
        if (lower.includes("i work as ")) {
            const match = text.match(/i\s+work\s+as\s+a?\s*([^.!?]+)/i);
            if (match && match[1].trim()) {
                results.push({
                    type: "profile",
                    key: "occupation",
                    value: match[1].trim(),
                    confidence: 0.85,
                });
            }
        }
        return results;
    }
}
exports.MemoryService = MemoryService;
exports.default = MemoryService;
