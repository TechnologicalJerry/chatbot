import mongoose from "mongoose";
import ConversationModel from "../conversations/conversation.model";
import MessageModel from "../messages/message.model";
import { createUserMessage } from "../messages/message.service";
import { getAIOrchestrator } from "../../infrastructure/ai/ai.factory";
import AppError from "../../errors/appError";
import env from "../../config/env";
import { chatStreamRequestsCounter } from "../../infrastructure/metrics/metrics";
import logger from "../../infrastructure/logger/logger";
import ContextService from "../../infrastructure/ai/context/context.service";
import ContextBuilder from "../../infrastructure/ai/context/context.builder";
import ConversationSummaryService from "../../infrastructure/ai/context/conversationSummary.service";
import MemoryService from "../memory/memory.service";
import { AIStreamChunk } from "../../infrastructure/ai/types";

export async function processChatMessage(userId: string, conversationId: string, content: string) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw AppError.notFound("Conversation not found");
  }
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    userId,
    status: { $ne: "deleted" },
  });

  if (!conversation) {
    throw AppError.notFound("Conversation not found");
  }

  const userMessage = await createUserMessage(userId, conversationId, content);
  const aiContext = await ContextService.buildAIContext(userId, conversationId, content);
  const aiInputMessages = ContextBuilder.toChatMessageTrajectory(aiContext);

  const startTime = Date.now();
  const orchestrator = getAIOrchestrator();

  let aiResponse;
  try {
    aiResponse = await orchestrator.generateCompletion(aiInputMessages, {
      model: env.OPENAI_MODEL,
      executionContext: { userId, conversationId },
    });
  } catch (err: any) {
    logger.error({ err, conversationId, userMessageId: userMessage._id }, "AI completion generation failed during chat processing");
    const assistantSeq = userMessage.sequence + 1;
    await MessageModel.create({
      conversationId,
      userId,
      role: "assistant",
      content: "Failed to generate AI response.",
      contentType: "text",
      sequence: assistantSeq,
      status: "failed",
      model: env.OPENAI_MODEL,
    });
    throw err;
  }

  const latency = Date.now() - startTime;
  const assistantSeq = userMessage.sequence + 1;

  const assistantMessage = await MessageModel.create({
    conversationId,
    userId,
    role: "assistant",
    content: aiResponse.message.content,
    contentType: "text",
    sequence: assistantSeq,
    status: "completed",
    model: env.OPENAI_MODEL,
    tokenUsage: aiResponse.usage,
    latency,
  });

  const updatedConv = await ConversationModel.findOneAndUpdate(
    { _id: conversationId },
    {
      $inc: { messageCount: 1 },
      $set: { lastMessageAt: assistantMessage.createdAt },
    },
    { new: true }
  );

  try {
    await MemoryService.extractAndStoreMemories(userId, conversationId, content, assistantMessage.content);
    if (updatedConv && ConversationSummaryService.shouldSummarize(updatedConv)) {
      await ConversationSummaryService.generateAndUpdateSummary(conversationId);
    }
  } catch (backgroundErr) {
    logger.error({ err: backgroundErr, conversationId }, "Error during post-chat turn memory/summary processing");
  }

  return {
    userMessage,
    assistantMessage,
  };
}

export async function processStreamingChatMessage(
  userId: string,
  conversationId: string,
  content: string,
  options: {
    signal?: AbortSignal;
    onStart?: (data: any) => void;
    onChunk: (chunk: AIStreamChunk) => void;
  }
) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw AppError.notFound("Conversation not found");
  }

  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    userId,
    status: { $ne: "deleted" },
  });

  if (!conversation) {
    throw AppError.notFound("Conversation not found");
  }

  const userMessage = await createUserMessage(userId, conversationId, content);
  const assistantSeq = userMessage.sequence + 1;

  const assistantMessage = await MessageModel.create({
    conversationId,
    userId,
    role: "assistant",
    content: "",
    contentType: "text",
    sequence: assistantSeq,
    status: "streaming",
    model: env.OPENAI_MODEL,
  });

  if (options.onStart) {
    options.onStart({
      userMessageId: userMessage._id.toString(),
      assistantMessageId: assistantMessage._id.toString(),
      conversationId,
    });
  }

  const aiContext = await ContextService.buildAIContext(userId, conversationId, content);
  const aiInputMessages = ContextBuilder.toChatMessageTrajectory(aiContext);

  const startTime = Date.now();
  const orchestrator = getAIOrchestrator();
  let accumulatedText = "";
  let tokenUsage: any;

  try {
    const stream = orchestrator.streamCompletion(aiInputMessages, {
      model: env.OPENAI_MODEL,
      signal: options.signal,
      executionContext: { userId, conversationId },
    });

    for await (const chunk of stream) {
      if (options.signal?.aborted) {
        break;
      }
      if (chunk.type === "text_delta" && chunk.text) {
        accumulatedText += chunk.text;
      }
      if (chunk.type === "completion" && chunk.usage) {
        tokenUsage = chunk.usage;
      }
      options.onChunk(chunk);
    }
  } catch (err) {
    if (options.signal?.aborted) {
      await MessageModel.updateOne(
        { _id: assistantMessage._id },
        {
          $set: {
            status: "cancelled",
            content: accumulatedText,
            metadata: { cancelledAt: new Date() },
          },
        }
      );
      chatStreamRequestsCounter.inc({ status: "cancelled" });
      return { userMessage, assistantMessage };
    }

    await MessageModel.updateOne(
      { _id: assistantMessage._id },
      {
        $set: {
          status: "failed",
          content: accumulatedText || "Failed during streaming",
        },
      }
    );
    chatStreamRequestsCounter.inc({ status: "failed" });
    throw err;
  }

  if (options.signal?.aborted) {
    await MessageModel.updateOne(
      { _id: assistantMessage._id },
      {
        $set: {
          status: "cancelled",
          content: accumulatedText,
          metadata: { cancelledAt: new Date() },
        },
      }
    );
    chatStreamRequestsCounter.inc({ status: "cancelled" });
    return { userMessage, assistantMessage };
  }

  const latency = Date.now() - startTime;

  await MessageModel.updateOne(
    { _id: assistantMessage._id },
    {
      $set: {
        status: "completed",
        content: accumulatedText,
        tokenUsage,
        latency,
      },
    }
  );

  const updatedConv = await ConversationModel.findOneAndUpdate(
    { _id: conversationId },
    {
      $inc: { messageCount: 1 },
      $set: { lastMessageAt: new Date() },
    },
    { new: true }
  );

  chatStreamRequestsCounter.inc({ status: "completed" });

  try {
    await MemoryService.extractAndStoreMemories(userId, conversationId, content, accumulatedText);
    if (updatedConv && ConversationSummaryService.shouldSummarize(updatedConv)) {
      await ConversationSummaryService.generateAndUpdateSummary(conversationId);
    }
  } catch (backgroundErr) {
    logger.error({ err: backgroundErr, conversationId }, "Error during streaming post-chat turn memory/summary processing");
  }

  const finalAssistantDoc = await MessageModel.findById(assistantMessage._id);

  return {
    userMessage,
    assistantMessage: finalAssistantDoc || assistantMessage,
  };
}
