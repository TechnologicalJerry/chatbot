import mongoose from "mongoose";
import MessageModel from "./message.model";
import ConversationModel from "../conversations/conversation.model";
import AppError from "../../errors/appError";
import { messagesCreatedCounter, messagesReadCounter } from "../../infrastructure/metrics/metrics";

export async function createUserMessage(userId: string, conversationId: string, content: string) {
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

  let messageDoc = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts && !messageDoc) {
    attempts++;
    const latestMsg = await MessageModel.findOne({ conversationId })
      .sort({ sequence: -1 })
      .select("sequence")
      .lean();

    const nextSequence = (latestMsg?.sequence || 0) + 1;

    try {
      messageDoc = await MessageModel.create({
        conversationId,
        userId,
        role: "user",
        content,
        contentType: "text",
        sequence: nextSequence,
        status: "completed",
      });
    } catch (err: any) {
      if (err.code === 11000 && attempts < maxAttempts) {
        continue;
      }
      throw err;
    }
  }

  if (!messageDoc) {
    throw AppError.internal("Failed to allocate sequential message position");
  }

  await ConversationModel.updateOne(
    { _id: conversationId },
    {
      $inc: { messageCount: 1 },
      $set: { lastMessageAt: messageDoc.createdAt },
    }
  );

  messagesCreatedCounter.inc();
  return messageDoc;
}

export async function listConversationMessages(
  userId: string,
  conversationId: string,
  options: { limit?: number; cursor?: string; direction?: string } = {}
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

  const limit = Math.min(Math.max(options.limit || 50, 1), 100);
  const query: any = { conversationId };

  if (options.cursor) {
    const cursorNum = Number(options.cursor);
    if (!isNaN(cursorNum)) {
      query.sequence = { $lt: cursorNum };
    } else if (mongoose.Types.ObjectId.isValid(options.cursor)) {
      query._id = { $lt: options.cursor };
    }
  }

  const items = await MessageModel.find(query)
    .sort({ sequence: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && resultItems.length > 0
      ? String(resultItems[resultItems.length - 1].sequence)
      : null;

  messagesReadCounter.inc();

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}
