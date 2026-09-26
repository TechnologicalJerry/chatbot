"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMessagesSchema = exports.createMessageSchema = void 0;
var zod_1 = require("zod");
/**
 * @openapi
 * components:
 *   schemas:
 *     CreateMessageInput:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           default: "Hello, how are you?"
 *           maxLength: 10000
 *     MessageResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         conversationId:
 *           type: string
 *         userId:
 *           type: string
 *         role:
 *           type: string
 *         content:
 *           type: string
 *         contentType:
 *           type: string
 *         sequence:
 *           type: number
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *     PaginatedMessagesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MessageResponse'
 *             nextCursor:
 *               type: string
 *               nullable: true
 *             hasMore:
 *               type: boolean
 */
exports.createMessageSchema = (0, zod_1.object)({
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
exports.listMessagesSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({
            required_error: "Conversation ID is required",
        }),
    }),
    query: (0, zod_1.object)({
        limit: (0, zod_1.preprocess)(function (val) { return (val ? Number(val) : 50); }, numberValidator()).optional(),
        cursor: (0, zod_1.string)().optional(),
        direction: (0, zod_1.enum)(["before", "after"]).default("before").optional(),
    }),
});
function numberValidator() {
    var number = require("zod").number;
    return number().min(1, "Limit must be at least 1").max(100, "Maximum page limit is 100");
}
