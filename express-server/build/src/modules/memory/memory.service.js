"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var memory_model_1 = __importDefault(require("./memory.model"));
var appError_1 = require("../../errors/appError");
var env_1 = require("../../config/env");
var logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
var metrics_1 = require("../../infrastructure/metrics/metrics");
var MemoryService = /** @class */ (function () {
    function MemoryService() {
    }
    /**
     * Fetch active memories for a given user.
     */
    MemoryService.getActiveUserMemories = function (userId, limit, type) {
        if (limit === void 0) { limit = 20; }
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                query = { userId: userId, status: "active" };
                if (type) {
                    query.type = type;
                }
                return [2 /*return*/, memory_model_1.default.find(query).sort({ updatedAt: -1 }).limit(limit)];
            });
        });
    };
    /**
     * Soft delete a specific memory item owned by authenticated user.
     */
    MemoryService.deleteUserMemory = function (userId, memoryId) {
        return __awaiter(this, void 0, void 0, function () {
            var memory;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_1.default.Types.ObjectId.isValid(memoryId)) {
                            throw appError_1.AppError.notFound("Memory item not found");
                        }
                        return [4 /*yield*/, memory_model_1.default.findOne({ _id: memoryId, userId: userId })];
                    case 1:
                        memory = _a.sent();
                        if (!memory) {
                            throw appError_1.AppError.notFound("Memory item not found");
                        }
                        if (memory.status === "deleted") {
                            return [2 /*return*/, true];
                        }
                        memory.status = "deleted";
                        return [4 /*yield*/, memory.save()];
                    case 2:
                        _a.sent();
                        metrics_1.memoryDeletedCounter.inc();
                        logger_1.default.info({ userId: userId, memoryId: memoryId }, "User memory soft-deleted");
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Selective memory extraction and persistence after a chat turn.
     */
    MemoryService.extractAndStoreMemories = function (userId, conversationId, userContent, assistantContent) {
        return __awaiter(this, void 0, void 0, function () {
            var lowerUserContent, _i, _a, keyword, extractedCandidates, savedMemories, _b, extractedCandidates_1, candidate, existing, newMemory;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        lowerUserContent = userContent.toLowerCase();
                        for (_i = 0, _a = MemoryService.SENSITIVE_KEYWORDS; _i < _a.length; _i++) {
                            keyword = _a[_i];
                            if (lowerUserContent.includes(keyword)) {
                                logger_1.default.info({ userId: userId, keyword: keyword }, "Memory extraction skipped due to sensitive keyword detection");
                                metrics_1.memoryExtractionCounter.inc({ status: "filtered" });
                                return [2 /*return*/, []];
                            }
                        }
                        extractedCandidates = MemoryService.detectMemoryCandidates(userContent, conversationId);
                        if (extractedCandidates.length === 0) {
                            metrics_1.memoryExtractionCounter.inc({ status: "none" });
                            return [2 /*return*/, []];
                        }
                        savedMemories = [];
                        _b = 0, extractedCandidates_1 = extractedCandidates;
                        _c.label = 1;
                    case 1:
                        if (!(_b < extractedCandidates_1.length)) return [3 /*break*/, 7];
                        candidate = extractedCandidates_1[_b];
                        if (candidate.confidence < env_1.env.AI_MEMORY_CONFIDENCE_THRESHOLD) {
                            return [3 /*break*/, 6];
                        }
                        return [4 /*yield*/, memory_model_1.default.findOne({
                                userId: userId,
                                type: candidate.type,
                                key: candidate.key,
                                status: "active",
                            })];
                    case 2:
                        existing = _c.sent();
                        if (!existing) return [3 /*break*/, 4];
                        if (existing.value === candidate.value) {
                            // Identical value, no update needed
                            return [3 /*break*/, 6];
                        }
                        // Value changed: supersede old memory and create new one
                        existing.status = "superseded";
                        return [4 /*yield*/, existing.save()];
                    case 3:
                        _c.sent();
                        metrics_1.memoryUpdatedCounter.inc();
                        _c.label = 4;
                    case 4: return [4 /*yield*/, memory_model_1.default.create({
                            userId: userId,
                            conversationId: conversationId,
                            type: candidate.type,
                            key: candidate.key,
                            value: candidate.value,
                            source: "conversation_extracted",
                            confidence: candidate.confidence,
                            status: "active",
                        })];
                    case 5:
                        newMemory = _c.sent();
                        metrics_1.memoryCreatedCounter.inc({ type: candidate.type });
                        savedMemories.push(newMemory);
                        logger_1.default.info({
                            userId: userId,
                            memoryId: newMemory._id,
                            type: candidate.type,
                            key: candidate.key,
                        }, "New memory extracted and stored");
                        _c.label = 6;
                    case 6:
                        _b++;
                        return [3 /*break*/, 1];
                    case 7:
                        metrics_1.memoryExtractionCounter.inc({ status: "success" });
                        return [2 /*return*/, savedMemories];
                }
            });
        });
    };
    /**
     * Helper to detect structured memory candidates from user text.
     */
    MemoryService.detectMemoryCandidates = function (text, conversationId) {
        var results = [];
        var lower = text.toLowerCase();
        // Preference patterns: "i prefer X", "my preference is X"
        if (lower.includes("i prefer ")) {
            var match = text.match(/i\s+prefer\s+([^.!?]+)/i);
            if (match && match[1].trim()) {
                var prefVal = match[1].trim();
                var key = "preference";
                if (prefVal.toLowerCase().includes("vegetarian") || prefVal.toLowerCase().includes("vegan") || prefVal.toLowerCase().includes("pescatarian")) {
                    key = "diet";
                }
                else if (prefVal.toLowerCase().includes("concise") || prefVal.toLowerCase().includes("brief") || prefVal.toLowerCase().includes("detailed")) {
                    key = "response_style";
                }
                results.push({
                    type: "preference",
                    key: key,
                    value: prefVal,
                    confidence: 0.9,
                });
            }
        }
        // Goal patterns: "my goal is X", "i want to achieve X"
        if (lower.includes("my goal is ")) {
            var match = text.match(/my\s+goal\s+is\s+([^.!?]+)/i);
            if (match && match[1].trim()) {
                results.push({
                    type: "goal",
                    key: "fitness_goal",
                    value: match[1].trim(),
                    confidence: 0.85,
                });
            }
        }
        // Profile / Fact patterns: "i am a X", "i work as X"
        if (lower.includes("i work as ")) {
            var match = text.match(/i\s+work\s+as\s+a?\s*([^.!?]+)/i);
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
    };
    /**
     * Sensitive keywords that MUST be excluded from automatic memory persistence for safety.
     */
    MemoryService.SENSITIVE_KEYWORDS = [
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
    return MemoryService;
}());
exports.MemoryService = MemoryService;
exports.default = MemoryService;
