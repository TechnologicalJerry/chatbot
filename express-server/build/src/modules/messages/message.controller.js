"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMessagesHandler = exports.createMessageHandler = void 0;
const message_service_1 = require("./message.service");
async function createMessageHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const conversationId = req.params.conversationId;
        const content = req.body.content;
        const message = await (0, message_service_1.createUserMessage)(userId, conversationId, content);
        return res.status(201).json({
            success: true,
            data: message,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.createMessageHandler = createMessageHandler;
async function listMessagesHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const conversationId = req.params.conversationId;
        const { limit, cursor, direction } = req.query;
        const result = await (0, message_service_1.listConversationMessages)(userId, conversationId, {
            limit: limit ? Number(limit) : undefined,
            cursor: cursor,
            direction: direction,
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
exports.listMessagesHandler = listMessagesHandler;
