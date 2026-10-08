"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationSummaryService = void 0;
const conversation_model_1 = __importDefault(require("../../../modules/conversations/conversation.model"));
const message_model_1 = __importDefault(require("../../../modules/messages/message.model"));
const ai_factory_1 = require("../ai.factory");
const env_1 = __importDefault(require("../../../config/env"));
const logger_1 = __importDefault(require("../../logger/logger"));
const metrics_1 = require("../../metrics/metrics");
class ConversationSummaryService {
    static shouldSummarize(conversation) {
        // Summarize if message count is >= 10 and no summary generated in last 5 messages
        return conversation.messageCount >= 10 && (!conversation.summaryLastMessageCount || conversation.messageCount - conversation.summaryLastMessageCount >= 5);
    }
    static async generateAndUpdateSummary(conversationId) {
        try {
            const messages = await message_model_1.default.find({ conversationId })
                .sort({ sequence: 1 })
                .limit(20)
                .lean();
            if (messages.length === 0)
                return null;
            const formatted = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
            const orchestrator = (0, ai_factory_1.getAIOrchestrator)();
            const summaryResult = await orchestrator.generateCompletion([
                {
                    role: "system",
                    content: "Summarize the key context and facts of the conversation concisely in 2-3 sentences.",
                },
                { role: "user", content: formatted },
            ], { model: env_1.default.OPENAI_MODEL });
            const summaryText = summaryResult.message.content;
            await conversation_model_1.default.updateOne({ _id: conversationId }, {
                $set: {
                    summary: summaryText,
                    summaryLastMessageCount: messages.length,
                },
            });
            metrics_1.contextSummaryUsedCounter.inc();
            logger_1.default.info({ conversationId }, "Conversation summary updated successfully");
            return summaryText;
        }
        catch (err) {
            logger_1.default.error({ err, conversationId }, "Failed to generate conversation summary");
            return null;
        }
    }
}
exports.ConversationSummaryService = ConversationSummaryService;
exports.default = ConversationSummaryService;
