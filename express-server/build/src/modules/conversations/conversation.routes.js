"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversation_controller_1 = require("./conversation.controller");
const requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
const validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
const conversation_schema_1 = require("./conversation.schema");
const message_controller_1 = require("../messages/message.controller");
const chat_controller_1 = require("../chat/chat.controller");
const router = (0, express_1.Router)();
router.use(requireUser_1.default);
router.post("/", (0, validateResource_1.default)(conversation_schema_1.createConversationSchema), conversation_controller_1.createConversationHandler);
router.get("/", conversation_controller_1.listConversationsHandler);
router.get("/:conversationId", (0, validateResource_1.default)(conversation_schema_1.getConversationSchema), conversation_controller_1.getConversationHandler);
router.put("/:conversationId", (0, validateResource_1.default)(conversation_schema_1.updateConversationSchema), conversation_controller_1.updateConversationHandler);
router.delete("/:conversationId", (0, validateResource_1.default)(conversation_schema_1.deleteConversationSchema), conversation_controller_1.deleteConversationHandler);
// Sub-routes for conversation messages and AI chat
router.get("/:conversationId/messages", message_controller_1.listMessagesHandler);
router.post("/:conversationId/messages", message_controller_1.createMessageHandler);
router.post("/:conversationId/chat", chat_controller_1.postChatHandler);
router.post("/:conversationId/chat/stream", chat_controller_1.streamChatHandler);
router.get("/:conversationId/chat/stream", chat_controller_1.streamChatHandler);
exports.default = router;
