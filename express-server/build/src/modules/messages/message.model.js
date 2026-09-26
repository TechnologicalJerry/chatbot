"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var messageSchema = new mongoose_1.default.Schema({
    conversationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    role: {
        type: String,
        enum: ["system", "user", "assistant", "tool"],
        default: "user",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    contentType: {
        type: String,
        enum: ["text", "image", "file", "audio"],
        default: "text",
        required: true,
    },
    sequence: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "streaming", "completed", "failed", "cancelled"],
        default: "completed",
        required: true,
    },
    model: {
        type: String,
        default: null,
    },
    tokenUsage: {
        promptTokens: { type: Number },
        completionTokens: { type: Number },
        totalTokens: { type: Number },
    },
    latency: {
        type: Number,
        default: null,
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
// Unique compound index guaranteeing sequential ordering & sequence uniqueness per conversation
messageSchema.index({ conversationId: 1, sequence: 1 }, { unique: true });
// Compound index for querying latest messages
messageSchema.index({ conversationId: 1, createdAt: -1 });
// Ownership index
messageSchema.index({ userId: 1, _id: 1 });
var MessageModel = mongoose_1.default.model("Message", messageSchema);
exports.MessageModel = MessageModel;
exports.default = MessageModel;
