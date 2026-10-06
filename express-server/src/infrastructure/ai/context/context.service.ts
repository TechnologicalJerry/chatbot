import ContextBuilder from "./context.builder";
import MemoryService from "../../../modules/memory/memory.service";
import { RAGService } from "../rag/rag.service";
import MessageModel from "../../../modules/messages/message.model";
import { AIContext, ChatMessage } from "../types";
import { contextBuildCounter, contextBuildDurationHistogram, contextMemoryUsedCounter } from "../../metrics/metrics";

export class ContextService {
  static async buildAIContext(
    userId: string,
    conversationId: string,
    userContent: string
  ): Promise<AIContext> {
    const startTime = Date.now();

    // 1. Fetch user active memories
    const memories = await MemoryService.getActiveUserMemories(userId, 10);
    contextMemoryUsedCounter.inc(memories.length);

    // 2. Fetch RAG context
    const ragResult = await RAGService.retrieveKnowledge(userId, userContent);

    // 3. Fetch recent conversation messages
    const recentMsgsDocs = await MessageModel.find({ conversationId })
      .sort({ sequence: -1 })
      .limit(10)
      .lean();

    const recentMessages: ChatMessage[] = recentMsgsDocs
      .reverse()
      .map((msg) => ({
        role: msg.role as any,
        content: msg.content,
      }));

    const context = ContextBuilder.build({
      memories,
      ragContext: ragResult.formattedContext,
      recentMessages,
      currentUserContent: userContent,
    });

    const duration = (Date.now() - startTime) / 1000;
    contextBuildCounter.inc();
    contextBuildDurationHistogram.observe(duration);

    return context;
  }
}

export default ContextService;
