"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetConversationSummaryTool = void 0;
const zod_1 = require("zod");
const conversation_model_1 = __importDefault(require("../../../../modules/conversations/conversation.model"));
class GetConversationSummaryTool {
    name = "get_conversation_summary";
    description = "Get existing summary for a conversation owned by the authenticated user.";
    inputSchema = zod_1.z.object({
        conversationId: zod_1.z.string().min(1),
    });
    async execute(args, context) {
        const validated = this.inputSchema.parse(args);
        const conv = await conversation_model_1.default.findOne({
            _id: validated.conversationId,
            userId: context.userId,
            status: { $ne: "deleted" },
        }).lean();
        if (!conv) {
            return { error: "Conversation not found or unauthorized" };
        }
        return {
            conversationId: conv._id,
            title: conv.title,
            summary: conv.summary || "No summary generated yet.",
            summarizedThroughSequence: conv.summarizedThroughSequence || conv.summaryLastMessageCount || 0,
        };
    }
}
exports.GetConversationSummaryTool = GetConversationSummaryTool;
exports.default = GetConversationSummaryTool;
