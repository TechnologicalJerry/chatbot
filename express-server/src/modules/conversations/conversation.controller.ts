import { Request, Response, NextFunction } from "express";
import {
  createConversation,
  deleteConversation,
  getConversationById,
  listUserConversations,
  updateConversation,
} from "./conversation.service";

export async function createConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const conversation = await createConversation(userId, req.body);
    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listConversationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const { limit, cursor, status } = req.query;
    const result = await listUserConversations(userId, {
      limit: limit ? Number(limit) : undefined,
      cursor: cursor as string,
      status: status as string,
    });
    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const conversationId = req.params.conversationId;
    const conversation = await getConversationById(userId, conversationId);
    return res.json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const conversationId = req.params.conversationId;
    const updated = await updateConversation(userId, conversationId, req.body);
    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const conversationId = req.params.conversationId;
    await deleteConversation(userId, conversationId);
    return res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
}
