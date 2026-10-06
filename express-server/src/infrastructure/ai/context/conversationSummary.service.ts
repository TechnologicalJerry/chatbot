import ConversationModel from "../../../modules/conversations/conversation.model";
import MessageModel from "../../../modules/messages/message.model";
import { getAIOrchestrator } from "../ai.factory";
import env from "../../../config/env";
import logger from "../../logger/logger";
import { contextSummaryUsedCounter } from "../../metrics/metrics";

export class ConversationSummaryService {
  static shouldSummarize(conversation: any): boolean {
    // Summarize if message count is >= 10 and no summary generated in last 5 messages
    return conversation.messageCount >= 10 && (!conversation.summaryLastMessageCount || conversation.messageCount - conversation.summaryLastMessageCount >= 5);
  }

  static async generateAndUpdateSummary(conversationId: string): Promise<string | null> {
    try {
      const messages = await MessageModel.find({ conversationId })
        .sort({ sequence: 1 })
        .limit(20)
        .lean();

      if (messages.length === 0) return null;

      const formatted = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
      const orchestrator = getAIOrchestrator();
      
      const summaryResult = await orchestrator.generateCompletion([
        {
          role: "system",
          content: "Summarize the key context and facts of the conversation concisely in 2-3 sentences.",
        },
        { role: "user", content: formatted },
      ], { model: env.OPENAI_MODEL });

      const summaryText = summaryResult.message.content;

      await ConversationModel.updateOne(
        { _id: conversationId },
        {
          $set: {
            summary: summaryText,
            summaryLastMessageCount: messages.length,
          },
        }
      );

      contextSummaryUsedCounter.inc();
      logger.info({ conversationId }, "Conversation summary updated successfully");
      return summaryText;
    } catch (err) {
      logger.error({ err, conversationId }, "Failed to generate conversation summary");
      return null;
    }
  }
}

export default ConversationSummaryService;
