import mongoose from "mongoose";
import ConversationModel from "./conversation.model";
import AppError from "../../errors/appError";
import { conversationCreatedCounter, conversationDeletedCounter } from "../../infrastructure/metrics/metrics";

export async function createConversation(userId: string, input: { title?: string; metadata?: any }) {
  const conversation = await ConversationModel.create({
    userId,
    title: input.title || "New Conversation",
    metadata: input.metadata || {},
    status: "active",
  });
  conversationCreatedCounter.inc();
  return conversation;
}

export async function getConversationById(userId: string, conversationId: string) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw AppError.notFound("Conversation not found");
  }
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    userId,
    status: { $ne: "deleted" },
  }).lean();

  if (!conversation) {
    throw AppError.notFound("Conversation not found");
  }
  return conversation;
}

export async function listUserConversations(
  userId: string,
  options: { limit?: number; cursor?: string; status?: string } = {}
) {
  const limit = Math.min(Math.max(options.limit || 20, 1), 100);
  const status = options.status || "active";
  const query: any = {
    userId,
    status,
  };

  if (options.cursor && mongoose.Types.ObjectId.isValid(options.cursor)) {
    query._id = { $lt: options.cursor };
  }

  const items = await ConversationModel.find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && resultItems.length > 0
      ? String(resultItems[resultItems.length - 1]._id)
      : null;

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}

export async function updateConversation(
  userId: string,
  conversationId: string,
  input: { title?: string; status?: "active" | "archived" | "deleted" }
) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw AppError.notFound("Conversation not found");
  }
  const updateFields: any = {};
  if (input.title !== undefined) updateFields.title = input.title;
  if (input.status !== undefined) updateFields.status = input.status;

  const updated = await ConversationModel.findOneAndUpdate(
    {
      _id: conversationId,
      userId,
      status: { $ne: "deleted" },
    },
    { $set: updateFields },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw AppError.notFound("Conversation not found");
  }
  return updated;
}

export async function deleteConversation(userId: string, conversationId: string) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw AppError.notFound("Conversation not found");
  }
  const result = await ConversationModel.findOneAndUpdate(
    {
      _id: conversationId,
      userId,
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "deleted",
        deletedAt: new Date(),
      },
    }
  );

  if (!result) {
    throw AppError.notFound("Conversation not found");
  }
  conversationDeletedCounter.inc();
}
