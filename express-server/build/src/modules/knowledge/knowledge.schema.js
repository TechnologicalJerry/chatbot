"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocumentSchema = exports.ingestDocumentSchema = void 0;
var zod_1 = require("zod");
exports.ingestDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({
            required_error: "Title is required",
        }).min(1).max(300),
        content: zod_1.z.string({
            required_error: "Content is required",
        }).min(1),
        sourceType: zod_1.z.enum(["text", "markdown", "file"]).default("text"),
    }),
});
exports.deleteDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        documentId: zod_1.z.string({
            required_error: "Document ID is required",
        }),
    }),
});
