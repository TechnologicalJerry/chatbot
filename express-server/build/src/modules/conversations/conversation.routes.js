"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var conversation_controller_1 = require("./conversation.controller");
var requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
var validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
var conversation_schema_1 = require("./conversation.schema");
var message_routes_1 = __importDefault(require("../messages/message.routes"));
var chat_routes_1 = __importDefault(require("../chat/chat.routes"));
var router = (0, express_1.Router)();
// All conversation endpoints require authentication
router.use(requireUser_1.default);
/**
 * @openapi
 * /api/v1/conversations:
 *   post:
 *     tags:
 *     - Conversation
 *     summary: Create a new conversation
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConversationInput'
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ConversationResponse'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized
 *   get:
 *     tags:
 *     - Conversation
 *     summary: List user's conversations with cursor pagination
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: limit
 *       in: query
 *       schema:
 *         type: integer
 *         default: 20
 *     - name: cursor
 *       in: query
 *       schema:
 *         type: string
 *     - name: status
 *       in: query
 *       schema:
 *         type: string
 *         enum: [active, archived]
 *         default: active
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedConversationsResponse'
 *       403:
 *         description: Unauthorized
 */
router.post("/", (0, validateResource_1.default)(conversation_schema_1.createConversationSchema), conversation_controller_1.createConversationHandler);
router.get("/", (0, validateResource_1.default)(conversation_schema_1.listConversationsSchema), conversation_controller_1.listConversationsHandler);
/**
 * @openapi
 * /api/v1/conversations/{conversationId}:
 *   get:
 *     tags:
 *     - Conversation
 *     summary: Get a conversation by ID
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: conversationId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     responses:
 *       200:
 *         description: Conversation details
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *   patch:
 *     tags:
 *     - Conversation
 *     summary: Update conversation title or status
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: conversationId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateConversationInput'
 *     responses:
 *       200:
 *         description: Conversation updated
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *   delete:
 *     tags:
 *     - Conversation
 *     summary: Delete (soft-delete) a conversation
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: conversationId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     responses:
 *       200:
 *         description: Conversation deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get("/:conversationId", (0, validateResource_1.default)(conversation_schema_1.getConversationSchema), conversation_controller_1.getConversationHandler);
router.patch("/:conversationId", (0, validateResource_1.default)(conversation_schema_1.updateConversationSchema), conversation_controller_1.updateConversationHandler);
router.delete("/:conversationId", (0, validateResource_1.default)(conversation_schema_1.deleteConversationSchema), conversation_controller_1.deleteConversationHandler);
// Mount Message sub-router under /:conversationId/messages
router.use("/:conversationId/messages", message_routes_1.default);
// Mount Chat completion sub-router under /:conversationId/chat
router.use("/:conversationId/chat", chat_routes_1.default);
exports.default = router;
