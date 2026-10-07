"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
const validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
const chat_schema_1 = require("./chat.schema");
const router = (0, express_1.Router)();
router.use(requireUser_1.default);
router.post("/:conversationId", (0, validateResource_1.default)(chat_schema_1.postChatSchema), chat_controller_1.postChatHandler);
router.post("/:conversationId/stream", (0, validateResource_1.default)(chat_schema_1.postChatSchema), chat_controller_1.streamChatHandler);
router.get("/:conversationId/stream", chat_controller_1.streamChatHandler);
exports.default = router;
