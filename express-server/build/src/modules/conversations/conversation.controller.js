"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversationHandler = exports.updateConversationHandler = exports.getConversationHandler = exports.listConversationsHandler = exports.createConversationHandler = void 0;
const conversation_service_1 = require("./conversation.service");
async function createConversationHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const conversation = await (0, conversation_service_1.createConversation)(userId, req.body);
        return res.status(201).json({
            success: true,
            data: conversation,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.createConversationHandler = createConversationHandler;
async function listConversationsHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const { limit, cursor, status } = req.query;
        const result = await (0, conversation_service_1.listUserConversations)(userId, {
            limit: limit ? Number(limit) : undefined,
            cursor: cursor,
            status: status,
        });
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.listConversationsHandler = listConversationsHandler;
async function getConversationHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const conversationId = req.params.conversationId;
        const conversation = await (0, conversation_service_1.getConversationById)(userId, conversationId);
        return res.json({
            success: true,
            data: conversation,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.getConversationHandler = getConversationHandler;
async function updateConversationHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const conversationId = req.params.conversationId;
        const updated = await (0, conversation_service_1.updateConversation)(userId, conversationId, req.body);
        return res.json({
            success: true,
            data: updated,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.updateConversationHandler = updateConversationHandler;
async function deleteConversationHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const conversationId = req.params.conversationId;
        await (0, conversation_service_1.deleteConversation)(userId, conversationId);
        return res.json({
            success: true,
            message: "Conversation deleted successfully",
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.deleteConversationHandler = deleteConversationHandler;
