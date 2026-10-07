"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processStreamingChatMessage = exports.processChatMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const conversation_model_1 = __importDefault(require("../conversations/conversation.model"));
const message_model_1 = __importDefault(require("../messages/message.model"));
const message_service_1 = require("../messages/message.service");
const ai_factory_1 = require("../../infrastructure/ai/ai.factory");
const appError_1 = __importDefault(require("../../errors/appError"));
const env_1 = __importDefault(require("../../config/env"));
const metrics_1 = require("../../infrastructure/metrics/metrics");
const logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
const context_service_1 = __importDefault(require("../../infrastructure/ai/context/context.service"));
const context_builder_1 = __importDefault(require("../../infrastructure/ai/context/context.builder"));
const conversationSummary_service_1 = __importDefault(require("../../infrastructure/ai/context/conversationSummary.service"));
const memory_service_1 = __importDefault(require("../memory/memory.service"));
async function processChatMessage(userId, conversationId, content) {
    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
        throw appError_1.default.notFound("Conversation not found");
    }
    const conversation = await conversation_model_1.default.findOne({
        _id: conversationId,
        userId,
        status: { $ne: "deleted" },
    });
    if (!conversation) {
        throw appError_1.default.notFound("Conversation not found");
    }
    const userMessage = await (0, message_service_1.createUserMessage)(userId, conversationId, content);
    const aiContext = await context_service_1.default.buildAIContext(userId, conversationId, content);
    const aiInputMessages = context_builder_1.default.toChatMessageTrajectory(aiContext);
    const startTime = Date.now();
    const orchestrator = (0, ai_factory_1.getAIOrchestrator)();
    let aiResponse;
    try {
        aiResponse = await orchestrator.generateCompletion(aiInputMessages, {
            model: env_1.default.OPENAI_MODEL,
            executionContext: { userId, conversationId },
        });
    }
    catch (err) {
        logger_1.default.error({ err, conversationId, userMessageId: userMessage._id }, "AI completion generation failed during chat processing");
        const assistantSeq = userMessage.sequence + 1;
        await message_model_1.default.create({
            conversationId,
            userId,
            role: "assistant",
            content: "Failed to generate AI response.",
            contentType: "text",
            sequence: assistantSeq,
            status: "failed",
            model: env_1.default.OPENAI_MODEL,
        });
        throw err;
    }
    const latency = Date.now() - startTime;
    const assistantSeq = userMessage.sequence + 1;
    const assistantMessage = await message_model_1.default.create({
        conversationId,
        userId,
        role: "assistant",
        content: aiResponse.message.content,
        contentType: "text",
        sequence: assistantSeq,
        status: "completed",
        model: env_1.default.OPENAI_MODEL,
        tokenUsage: aiResponse.usage,
        latency,
    });
    const updatedConv = await conversation_model_1.default.findOneAndUpdate({ _id: conversationId }, {
        $inc: { messageCount: 1 },
        $set: { lastMessageAt: assistantMessage.createdAt },
    }, { new: true });
    try {
        await memory_service_1.default.extractAndStoreMemories(userId, conversationId, content, assistantMessage.content);
        if (updatedConv && conversationSummary_service_1.default.shouldSummarize(updatedConv)) {
            await conversationSummary_service_1.default.generateAndUpdateSummary(conversationId);
        }
    }
    catch (backgroundErr) {
        logger_1.default.error({ err: backgroundErr, conversationId }, "Error during post-chat turn memory/summary processing");
    }
    return {
        userMessage,
        assistantMessage,
    };
}
exports.processChatMessage = processChatMessage;
async function processStreamingChatMessage(userId, conversationId, content, options) {
    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
        throw appError_1.default.notFound("Conversation not found");
    }
    const conversation = await conversation_model_1.default.findOne({
        _id: conversationId,
        userId,
        status: { $ne: "deleted" },
    });
    if (!conversation) {
        throw appError_1.default.notFound("Conversation not found");
    }
    const userMessage = await (0, message_service_1.createUserMessage)(userId, conversationId, content);
    const assistantSeq = userMessage.sequence + 1;
    const assistantMessage = await message_model_1.default.create({
        conversationId,
        userId,
        role: "assistant",
        content: "",
        contentType: "text",
        sequence: assistantSeq,
        status: "streaming",
        model: env_1.default.OPENAI_MODEL,
    });
    if (options.onStart) {
        options.onStart({
            userMessageId: userMessage._id.toString(),
            assistantMessageId: assistantMessage._id.toString(),
            conversationId,
        });
    }
    const aiContext = await context_service_1.default.buildAIContext(userId, conversationId, content);
    const aiInputMessages = context_builder_1.default.toChatMessageTrajectory(aiContext);
    const startTime = Date.now();
    const orchestrator = (0, ai_factory_1.getAIOrchestrator)();
    let accumulatedText = "";
    let tokenUsage;
    try {
        const stream = orchestrator.streamCompletion(aiInputMessages, {
            model: env_1.default.OPENAI_MODEL,
            signal: options.signal,
            executionContext: { userId, conversationId },
        });
        for await (const chunk of stream) {
            if (options.signal?.aborted) {
                break;
            }
            if (chunk.type === "text_delta" && chunk.text) {
                accumulatedText += chunk.text;
            }
            if (chunk.type === "completion" && chunk.usage) {
                tokenUsage = chunk.usage;
            }
            options.onChunk(chunk);
        }
    }
    catch (err) {
        if (options.signal?.aborted) {
            await message_model_1.default.updateOne({ _id: assistantMessage._id }, {
                $set: {
                    status: "cancelled",
                    content: accumulatedText,
                    metadata: { cancelledAt: new Date() },
                },
            });
            metrics_1.chatStreamRequestsCounter.inc({ status: "cancelled" });
            return { userMessage, assistantMessage };
        }
        await message_model_1.default.updateOne({ _id: assistantMessage._id }, {
            $set: {
                status: "failed",
                content: accumulatedText || "Failed during streaming",
            },
        });
        metrics_1.chatStreamRequestsCounter.inc({ status: "failed" });
        throw err;
    }
    if (options.signal?.aborted) {
        await message_model_1.default.updateOne({ _id: assistantMessage._id }, {
            $set: {
                status: "cancelled",
                content: accumulatedText,
                metadata: { cancelledAt: new Date() },
            },
        });
        metrics_1.chatStreamRequestsCounter.inc({ status: "cancelled" });
        return { userMessage, assistantMessage };
    }
    const latency = Date.now() - startTime;
    await message_model_1.default.updateOne({ _id: assistantMessage._id }, {
        $set: {
            status: "completed",
            content: accumulatedText,
            tokenUsage,
            latency,
        },
    });
    const updatedConv = await conversation_model_1.default.findOneAndUpdate({ _id: conversationId }, {
        $inc: { messageCount: 1 },
        $set: { lastMessageAt: new Date() },
    }, { new: true });
    metrics_1.chatStreamRequestsCounter.inc({ status: "completed" });
    try {
        await memory_service_1.default.extractAndStoreMemories(userId, conversationId, content, accumulatedText);
        if (updatedConv && conversationSummary_service_1.default.shouldSummarize(updatedConv)) {
            await conversationSummary_service_1.default.generateAndUpdateSummary(conversationId);
        }
    }
    catch (backgroundErr) {
        logger_1.default.error({ err: backgroundErr, conversationId }, "Error during streaming post-chat turn memory/summary processing");
    }
    const finalAssistantDoc = await message_model_1.default.findById(assistantMessage._id);
    return {
        userMessage,
        assistantMessage: finalAssistantDoc || assistantMessage,
    };
}
exports.processStreamingChatMessage = processStreamingChatMessage;
