"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var message_controller_1 = require("./message.controller");
var requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
var validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
var message_schema_1 = require("./message.schema");
var router = (0, express_1.Router)({ mergeParams: true });
// Require authentication for message endpoints
router.use(requireUser_1.default);
/**
 * @openapi
 * /api/v1/conversations/{conversationId}/messages:
 *   post:
 *     tags:
 *     - Message
 *     summary: Post a new user message to a conversation
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
 *             $ref: '#/components/schemas/CreateMessageInput'
 *     responses:
 *       201:
 *         description: User message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *   get:
 *     tags:
 *     - Message
 *     summary: List conversation messages with cursor pagination
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: conversationId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     - name: limit
 *       in: query
 *       schema:
 *         type: integer
 *         default: 50
 *     - name: cursor
 *       in: query
 *       schema:
 *         type: string
 *     responses:
 *       200:
 *         description: List of conversation messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMessagesResponse'
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.post("/", (0, validateResource_1.default)(message_schema_1.createMessageSchema), message_controller_1.createMessageHandler);
router.get("/", (0, validateResource_1.default)(message_schema_1.listMessagesSchema), message_controller_1.listMessagesHandler);
exports.default = router;
