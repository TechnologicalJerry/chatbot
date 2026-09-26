"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryModel = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var memorySchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    conversationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Conversation",
        default: null,
        index: true,
    },
    type: {
        type: String,
        enum: ["preference", "profile", "goal", "constraint", "fact"],
        required: true,
    },
    key: {
        type: String,
        required: true,
        trim: true,
    },
    value: {
        type: String,
        required: true,
        trim: true,
    },
    source: {
        type: String,
        enum: ["explicit_user", "conversation_extracted", "system"],
        default: "conversation_extracted",
    },
    confidence: {
        type: Number,
        default: 1.0,
    },
    status: {
        type: String,
        enum: ["active", "deleted", "superseded"],
        default: "active",
        required: true,
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
// Indexes
memorySchema.index({ userId: 1, status: 1, type: 1, key: 1 });
memorySchema.index({ userId: 1, _id: 1 });
var MemoryModel = mongoose_1.default.model("Memory", memorySchema);
exports.MemoryModel = MemoryModel;
exports.default = MemoryModel;
