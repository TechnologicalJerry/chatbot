import { Request, Response, NextFunction } from "express";
import { createUserMessage, listConversationMessages } from "./message.service";

export async function createMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const conversationId = req.params.conversationId;
    const content = req.body.content;

    const message = await createUserMessage(userId, conversationId, content);
    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listMessagesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const conversationId = req.params.conversationId;
    const { limit, cursor, direction } = req.query;

    const result = await listConversationMessages(userId, conversationId, {
      limit: limit ? Number(limit) : undefined,
      cursor: cursor as string,
      direction: direction as string,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}
