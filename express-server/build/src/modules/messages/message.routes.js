"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("./message.controller");
const requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
const validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
const message_schema_1 = require("./message.schema");
const router = (0, express_1.Router)();
router.use(requireUser_1.default);
router.post("/:conversationId/messages", (0, validateResource_1.default)(message_schema_1.createMessageSchema), message_controller_1.createMessageHandler);
router.get("/:conversationId/messages", message_controller_1.listMessagesHandler);
exports.default = router;
