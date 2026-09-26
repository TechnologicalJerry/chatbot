"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var conversationSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        default: "New Conversation",
        trim: true,
        maxlength: 200,
    },
    status: {
        type: String,
        enum: ["active", "archived", "deleted"],
        default: "active",
        required: true,
    },
    model: {
        type: String,
        default: null,
    },
    systemPromptVersion: {
        type: String,
        default: null,
    },
    metadata: {
        type: SchemaTypeMetadata(),
        default: {},
    },
    messageCount: {
        type: Number,
        default: 0,
    },
    lastMessageAt: {
        type: Date,
        default: null,
    },
    summary: {
        type: String,
        default: "",
    },
    summaryVersion: {
        type: Number,
        default: 0,
    },
    summarizedThroughSequence: {
        type: Number,
        default: 0,
    },
    summaryTokens: {
        type: Number,
        default: 0,
    },
    summaryUpdatedAt: {
        type: Date,
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
function SchemaTypeMetadata() {
    return mongoose_1.default.Schema.Types.Mixed;
}
// Compound Index for fast paginated listing of user's conversations
conversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
// Compound Index for fast ownership check
conversationSchema.index({ userId: 1, _id: 1 });
var ConversationModel = mongoose_1.default.model("Conversation", conversationSchema);
exports.ConversationModel = ConversationModel;
exports.default = ConversationModel;
