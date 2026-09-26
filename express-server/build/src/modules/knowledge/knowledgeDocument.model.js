"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeDocumentModel = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var knowledgeDocumentSchema = new mongoose_1.default.Schema({
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
    },
    sourceType: {
        type: String,
        enum: ["text", "markdown", "file"],
        default: "text",
        required: true,
    },
    sourceReference: {
        type: String,
        default: null,
    },
    contentHash: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["pending", "processing", "ready", "failed", "deleted"],
        default: "pending",
        required: true,
    },
    chunkCount: {
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
knowledgeDocumentSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
knowledgeDocumentSchema.index({ ownerId: 1, contentHash: 1, status: 1 });
var KnowledgeDocumentModel = mongoose_1.default.model("KnowledgeDocument", knowledgeDocumentSchema);
exports.KnowledgeDocumentModel = KnowledgeDocumentModel;
exports.default = KnowledgeDocumentModel;
