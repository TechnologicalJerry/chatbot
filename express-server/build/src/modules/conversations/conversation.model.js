"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const conversationSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: "New Conversation" },
    status: {
        type: String,
        enum: ["active", "archived", "deleted"],
        default: "active",
        index: true,
    },
    metadata: { type: mongoose_1.default.Schema.Types.Mixed, default: {} },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date },
    summary: { type: String },
    summaryLastMessageCount: { type: Number, default: 0 },
    deletedAt: { type: Date },
}, {
    timestamps: true,
});
conversationSchema.index({ userId: 1, status: 1, updatedAt: -1, _id: -1 });
exports.ConversationModel = mongoose_1.default.model("Conversation", conversationSchema);
exports.default = exports.ConversationModel;
