"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMemorySchema = exports.createMemorySchema = void 0;
const zod_1 = require("zod");
exports.createMemorySchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        type: (0, zod_1.enum)(["preference", "fact", "goal", "profile"]),
        key: (0, zod_1.string)({ required_error: "key is required" }),
        value: (0, zod_1.string)({ required_error: "value is required" }),
        conversationId: (0, zod_1.string)().optional(),
        confidence: (0, zod_1.number)().optional(),
    }),
});
exports.deleteMemorySchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        memoryId: (0, zod_1.string)({ required_error: "memoryId is required" }),
    }),
});
