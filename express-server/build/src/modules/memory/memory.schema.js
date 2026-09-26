"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMemorySchema = exports.getMemoriesSchema = void 0;
var zod_1 = require("zod");
exports.getMemoriesSchema = zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z.enum(["preference", "profile", "goal", "constraint", "fact"]).optional(),
        limit: zod_1.z.coerce.number().min(1).max(50).default(20),
    }),
});
exports.deleteMemorySchema = zod_1.z.object({
    params: zod_1.z.object({
        memoryId: zod_1.z.string({
            required_error: "Memory ID is required",
        }),
    }),
});
