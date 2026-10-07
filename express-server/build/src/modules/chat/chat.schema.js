"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postChatSchema = void 0;
const zod_1 = require("zod");
exports.postChatSchema = (0, zod_1.object)({
    params: (0, zod_1.object)({
        conversationId: (0, zod_1.string)({ required_error: "conversationId is required" }),
    }),
    body: (0, zod_1.object)({
        content: (0, zod_1.string)({ required_error: "content is required" }),
    }),
});
