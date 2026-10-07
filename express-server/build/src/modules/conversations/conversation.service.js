"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.updateConversation = exports.listUserConversations = exports.getConversationById = exports.createConversation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const conversation_model_1 = __importDefault(require("./conversation.model"));
const appError_1 = __importDefault(require("../../errors/appError"));
const metrics_1 = require("../../infrastructure/metrics/metrics");
async function createConversation(userId, input) {
    const conversation = await conversation_model_1.default.create({
        userId,
        title: input.title || "New Conversation",
        metadata: input.metadata || {},
        status: "active",
    });
    metrics_1.conversationCreatedCounter.inc();
    return conversation;
}
exports.createConversation = createConversation;
async function getConversationById(userId, conversationId) {
    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
        throw appError_1.default.notFound("Conversation not found");
    }
    const conversation = await conversation_model_1.default.findOne({
        _id: conversationId,
        userId,
        status: { $ne: "deleted" },
    }).lean();
    if (!conversation) {
        throw appError_1.default.notFound("Conversation not found");
    }
    return conversation;
}
exports.getConversationById = getConversationById;
async function listUserConversations(userId, options = {}) {
    const limit = Math.min(Math.max(options.limit || 20, 1), 100);
    const status = options.status || "active";
    const query = {
        userId,
        status,
    };
    if (options.cursor && mongoose_1.default.Types.ObjectId.isValid(options.cursor)) {
        query._id = { $lt: options.cursor };
    }
    const items = await conversation_model_1.default.find(query)
        .sort({ updatedAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean();
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && resultItems.length > 0
        ? String(resultItems[resultItems.length - 1]._id)
        : null;
    return {
        items: resultItems,
        nextCursor,
        hasMore,
    };
}
exports.listUserConversations = listUserConversations;
async function updateConversation(userId, conversationId, input) {
    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
        throw appError_1.default.notFound("Conversation not found");
    }
    const updateFields = {};
    if (input.title !== undefined)
        updateFields.title = input.title;
    if (input.status !== undefined)
        updateFields.status = input.status;
    const updated = await conversation_model_1.default.findOneAndUpdate({
        _id: conversationId,
        userId,
        status: { $ne: "deleted" },
    }, { $set: updateFields }, { new: true, runValidators: true }).lean();
    if (!updated) {
        throw appError_1.default.notFound("Conversation not found");
    }
    return updated;
}
exports.updateConversation = updateConversation;
async function deleteConversation(userId, conversationId) {
    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
        throw appError_1.default.notFound("Conversation not found");
    }
    const result = await conversation_model_1.default.findOneAndUpdate({
        _id: conversationId,
        userId,
        status: { $ne: "deleted" },
    }, {
        $set: {
            status: "deleted",
            deletedAt: new Date(),
        },
    });
    if (!result) {
        throw appError_1.default.notFound("Conversation not found");
    }
    metrics_1.conversationDeletedCounter.inc();
}
exports.deleteConversation = deleteConversation;
