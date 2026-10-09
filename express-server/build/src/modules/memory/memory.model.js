"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const memorySchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    conversationId: { type: String },
    type: {
        type: String,
        enum: ["preference", "fact", "goal", "profile"],
        required: true,
        index: true,
    },
    key: { type: String, required: true },
    value: { type: String, required: true },
    source: { type: String, default: "manual" },
    confidence: { type: Number, default: 1.0 },
    status: {
        type: String,
        enum: ["active", "superseded", "deleted"],
        default: "active",
        index: true,
    },
}, {
    timestamps: true,
});
memorySchema.index({ userId: 1, status: 1, type: 1, key: 1 });
exports.MemoryModel = mongoose_1.default.model("Memory", memorySchema);
exports.default = exports.MemoryModel;
