"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextService = void 0;
const context_builder_1 = __importDefault(require("./context.builder"));
const memory_service_1 = __importDefault(require("../../../modules/memory/memory.service"));
const rag_service_1 = require("../rag/rag.service");
const message_model_1 = __importDefault(require("../../../modules/messages/message.model"));
const metrics_1 = require("../../metrics/metrics");
class ContextService {
    static async buildAIContext(userId, conversationId, userContent) {
        const startTime = Date.now();
        // 1. Fetch user active memories
        const memories = await memory_service_1.default.getActiveUserMemories(userId, 10);
        metrics_1.contextMemoryUsedCounter.inc(memories.length);
        // 2. Fetch RAG context
        const ragResult = await rag_service_1.RAGService.retrieveKnowledge(userId, userContent);
        // 3. Fetch recent conversation messages
        const recentMsgsDocs = await message_model_1.default.find({ conversationId })
            .sort({ sequence: -1 })
            .limit(10)
            .lean();
        const recentMessages = recentMsgsDocs
            .reverse()
            .map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
        const context = context_builder_1.default.build({
            memories,
            ragContext: ragResult.formattedContext,
            recentMessages,
            currentUserContent: userContent,
        });
        const duration = (Date.now() - startTime) / 1000;
        metrics_1.contextBuildCounter.inc();
        metrics_1.contextBuildDurationHistogram.observe(duration);
        return context;
    }
}
exports.ContextService = ContextService;
exports.default = ContextService;
