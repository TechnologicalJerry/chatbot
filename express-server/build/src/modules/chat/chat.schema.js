"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postChatSchema = void 0;
var zod_1 = require("zod");
/**
 * @openapi
 * components:
 *   schemas:
 *     ChatInput:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           default: "Hello, who are you?"
 *           maxLength: 10000
 *     ChatCompletionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             userMessage:
 *               $ref: '#/components/schemas/MessageResponse'
 *             assistantMessage:
 *               $ref: '#/components/schemas/MessageResponse'
 */
exports.postChatSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({
            required_error: "Conversation ID is required",
        }),
    }),
    body: (0, zod_1.object)({
        content: (0, zod_1.string)({
            required_error: "Message content is required",
            invalid_type_error: "Content must be a string",
        })
            .trim()
            .min(1, "Message content cannot be empty")
            .max(10000, "Message content cannot exceed 10000 characters"),
    }),
});
