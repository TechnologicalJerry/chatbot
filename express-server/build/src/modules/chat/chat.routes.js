"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var chat_controller_1 = require("./chat.controller");
var requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
var validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
var chat_schema_1 = require("./chat.schema");
var router = (0, express_1.Router)({ mergeParams: true });
// Unauthenticated status route
router.get("/status", function (req, res) {
    res.json({
        status: "ready",
        module: "chat",
        stage: 5,
        message: "Streaming Chat Server-Sent Events (SSE) initialized.",
    });
});
// Require authentication for chat completion
router.use(requireUser_1.default);
/**
 * @openapi
 * /api/v1/conversations/{conversationId}/chat:
 *   post:
 *     tags:
 *     - Chat
 *     summary: Post a user message and receive AI assistant response
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: conversationId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatInput'
 *     responses:
 *       201:
 *         description: Chat completion successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatCompletionResponse'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
var rateLimiter_middleware_1 = require("../../middleware/rateLimiter.middleware");
var streamLimiter_middleware_1 = require("../../middleware/streamLimiter.middleware");
router.post("/", rateLimiter_middleware_1.chatRateLimiter, (0, validateResource_1.default)(chat_schema_1.postChatSchema), chat_controller_1.postChatHandler);
/**
 * @openapi
 * /api/v1/conversations/{conversationId}/chat/stream:
 *   post:
 *     tags:
 *     - Chat
 *     summary: Stream AI assistant response via Server-Sent Events (SSE)
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: conversationId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatInput'
 *     responses:
 *       200:
 *         description: SSE stream initiated (text/event-stream)
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.post("/stream", rateLimiter_middleware_1.chatRateLimiter, streamLimiter_middleware_1.streamConcurrencyLimiter, (0, validateResource_1.default)(chat_schema_1.postChatSchema), chat_controller_1.streamChatHandler);
exports.default = router;
