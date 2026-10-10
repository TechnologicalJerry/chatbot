"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: {
        type: String,
        enum: ["system", "user", "assistant", "tool"],
        required: true,
    },
    content: { type: String, required: true, default: "" },
    contentType: {
        type: String,
        enum: ["text", "json", "markdown"],
        default: "text",
    },
    sequence: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "streaming", "completed", "failed", "cancelled"],
        default: "completed",
    },
    model: { type: String },
    tokenUsage: {
        promptTokens: { type: Number },
        completionTokens: { type: Number },
        totalTokens: { type: Number },
    },
    latency: { type: Number },
    metadata: { type: mongoose_1.default.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
});
messageSchema.index({ conversationId: 1, sequence: -1 }, { unique: true });
exports.MessageModel = mongoose_1.default.model("Message", messageSchema);
exports.default = exports.MessageModel;
