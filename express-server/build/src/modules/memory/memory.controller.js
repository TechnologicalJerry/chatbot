"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMemoryHandler = exports.createMemoryHandler = exports.listMemoriesHandler = void 0;
const memory_service_1 = __importDefault(require("./memory.service"));
const memory_model_1 = __importDefault(require("./memory.model"));
async function listMemoriesHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const { limit, type } = req.query;
        const memories = await memory_service_1.default.getActiveUserMemories(userId, limit ? Number(limit) : 20, type);
        return res.json({
            success: true,
            data: memories,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.listMemoriesHandler = listMemoriesHandler;
async function createMemoryHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const { type, key, value, conversationId, confidence } = req.body;
        const memory = await memory_model_1.default.create({
            userId,
            conversationId,
            type,
            key,
            value,
            confidence: confidence || 1.0,
            source: "manual",
            status: "active",
        });
        return res.status(201).json({
            success: true,
            data: memory,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.createMemoryHandler = createMemoryHandler;
async function deleteMemoryHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const memoryId = req.params.memoryId;
        await memory_service_1.default.deleteUserMemory(userId, memoryId);
        return res.json({
            success: true,
            message: "Memory item deleted successfully",
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.deleteMemoryHandler = deleteMemoryHandler;
