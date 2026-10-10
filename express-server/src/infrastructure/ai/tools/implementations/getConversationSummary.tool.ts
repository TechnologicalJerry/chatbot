import { z } from "zod";
import { ITool, ToolExecutionContext } from "../tool.interface";
import ConversationModel from "../../../../modules/conversations/conversation.model";

export class GetConversationSummaryTool implements ITool {
  public name = "get_conversation_summary";
  public description = "Get existing summary for a conversation owned by the authenticated user.";
  public inputSchema = z.object({
    conversationId: z.string().min(1),
  });

  async execute(args: any, context: ToolExecutionContext): Promise<any> {
    const validated = this.inputSchema.parse(args);

    const conv = await ConversationModel.findOne({
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
      summarizedThroughSequence: (conv as any).summarizedThroughSequence || conv.summaryLastMessageCount || 0,
    };
  }
}

export default GetConversationSummaryTool;
