"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversationSchema = exports.getConversationSchema = exports.updateConversationSchema = exports.createConversationSchema = void 0;
const zod_1 = require("zod");
exports.createConversationSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        title: (0, zod_1.string)().optional(),
        metadata: (0, zod_1.any)().optional(),
    }),
});
exports.updateConversationSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({ required_error: "conversationId is required" }),
    }),
    body: (0, zod_1.object)({
        title: (0, zod_1.string)().optional(),
        status: (0, zod_1.enum)(["active", "archived", "deleted"]).optional(),
    }),
});
exports.getConversationSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({ required_error: "conversationId is required" }),
    }),
});
exports.deleteConversationSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({ required_error: "conversationId is required" }),
    }),
});
