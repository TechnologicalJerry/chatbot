"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConversationsSchema = exports.deleteConversationSchema = exports.getConversationSchema = exports.updateConversationSchema = exports.createConversationSchema = void 0;
var zod_1 = require("zod");
/**
 * @openapi
 * components:
 *   schemas:
 *     CreateConversationInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           default: "Fitness Planning"
 *           maxLength: 200
 *         metadata:
 *           type: object
 *     UpdateConversationInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           default: "Updated Fitness Plan"
 *         status:
 *           type: string
 *           enum: [active, archived]
 *     ConversationResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         title:
 *           type: string
 *         status:
 *           type: string
 *         messageCount:
 *           type: number
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *     PaginatedConversationsResponse:
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
 *                 $ref: '#/components/schemas/ConversationResponse'
 *             nextCursor:
 *               type: string
 *               nullable: true
 *             hasMore:
 *               type: boolean
 */
exports.createConversationSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        title: (0, zod_1.string)({
            invalid_type_error: "Title must be a string",
        })
            .trim()
            .min(1, "Title cannot be empty")
            .max(200, "Title cannot exceed 200 characters")
            .optional(),
        metadata: (0, zod_1.record)((0, zod_1.unknown)()).optional(),
    }),
});
exports.updateConversationSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({
            required_error: "Conversation ID is required",
        }),
    }),
    body: (0, zod_1.object)({
        title: (0, zod_1.string)({
            invalid_type_error: "Title must be a string",
        })
            .trim()
            .min(1, "Title cannot be empty")
            .max(200, "Title cannot exceed 200 characters")
            .optional(),
        status: (0, zod_1.enum)(["active", "archived"], {
            errorMap: function () { return ({ message: "Status must be either 'active' or 'archived'" }); },
        }).optional(),
    }),
});
exports.getConversationSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({
            required_error: "Conversation ID is required",
        }),
    }),
});
exports.deleteConversationSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({
            required_error: "Conversation ID is required",
        }),
    }),
});
exports.listConversationsSchema = (0, zod_1.object)({
    query: (0, zod_1.object)({
        limit: (0, zod_1.preprocess)(function (val) { return (val ? Number(val) : 20); }, numberValidator()).optional(),
        cursor: (0, zod_1.string)().optional(),
        status: (0, zod_1.enum)(["active", "archived"]).default("active").optional(),
    }),
});
function numberValidator() {
    var number = require("zod").number;
    return number().min(1, "Limit must be at least 1").max(100, "Maximum page limit is 100");
}
