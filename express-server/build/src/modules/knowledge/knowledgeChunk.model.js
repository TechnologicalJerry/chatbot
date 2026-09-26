"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeChunkModel = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var knowledgeChunkSchema = new mongoose_1.default.Schema({
    documentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "KnowledgeDocument",
        required: true,
        index: true,
    },
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    sequence: {
        type: Number,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    embedding: {
        type: [Number],
        required: true,
    },
    tokenCount: {
        type: Number,
        default: 0,
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
// Indexes
knowledgeChunkSchema.index({ ownerId: 1, documentId: 1, sequence: 1 });
var KnowledgeChunkModel = mongoose_1.default.model("KnowledgeChunk", knowledgeChunkSchema);
exports.KnowledgeChunkModel = KnowledgeChunkModel;
exports.default = KnowledgeChunkModel;
