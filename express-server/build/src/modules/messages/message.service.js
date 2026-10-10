"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConversationMessages = exports.createUserMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const message_model_1 = __importDefault(require("./message.model"));
const conversation_model_1 = __importDefault(require("../conversations/conversation.model"));
const appError_1 = __importDefault(require("../../errors/appError"));
const metrics_1 = require("../../infrastructure/metrics/metrics");
async function createUserMessage(userId, conversationId, content) {
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
    let messageDoc = null;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts && !messageDoc) {
        attempts++;
        const latestMsg = await message_model_1.default.findOne({ conversationId })
            .sort({ sequence: -1 })
            .select("sequence")
            .lean();
        const nextSequence = (latestMsg?.sequence || 0) + 1;
        try {
            messageDoc = await message_model_1.default.create({
                conversationId,
                userId,
                role: "user",
                content,
                contentType: "text",
                sequence: nextSequence,
                status: "completed",
            });
        }
        catch (err) {
            if (err.code === 11000 && attempts < maxAttempts) {
                continue;
            }
            throw err;
        }
    }
    if (!messageDoc) {
        throw appError_1.default.internal("Failed to allocate sequential message position");
    }
    await conversation_model_1.default.updateOne({ _id: conversationId }, {
        $inc: { messageCount: 1 },
        $set: { lastMessageAt: messageDoc.createdAt },
    });
    metrics_1.messagesCreatedCounter.inc();
    return messageDoc;
}
exports.createUserMessage = createUserMessage;
async function listConversationMessages(userId, conversationId, options = {}) {
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
    const limit = Math.min(Math.max(options.limit || 50, 1), 100);
    const query = { conversationId };
    if (options.cursor) {
        const cursorNum = Number(options.cursor);
        if (!isNaN(cursorNum)) {
            query.sequence = { $lt: cursorNum };
        }
        else if (mongoose_1.default.Types.ObjectId.isValid(options.cursor)) {
            query._id = { $lt: options.cursor };
        }
    }
    const items = await message_model_1.default.find(query)
        .sort({ sequence: -1 })
        .limit(limit + 1)
        .lean();
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && resultItems.length > 0
        ? String(resultItems[resultItems.length - 1].sequence)
        : null;
    metrics_1.messagesReadCounter.inc();
    return {
        items: resultItems,
        nextCursor,
        hasMore,
    };
}
exports.listConversationMessages = listConversationMessages;
