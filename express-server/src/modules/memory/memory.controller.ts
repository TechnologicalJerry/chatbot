import { Request, Response, NextFunction } from "express";
import MemoryService from "./memory.service";
import MemoryModel from "./memory.model";

export async function listMemoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const { limit, type } = req.query;
    const memories = await MemoryService.getActiveUserMemories(
      userId,
      limit ? Number(limit) : 20,
      type as string
    );
    return res.json({
      success: true,
      data: memories,
    });
  } catch (err) {
    return next(err);
  }
}

export async function createMemoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const { type, key, value, conversationId, confidence } = req.body;

    const memory = await MemoryModel.create({
      userId,
      conversationId,
      type,
      key,
      value,
      confidence: confidence || 1.0,
      source: "manual",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      data: memory,
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteMemoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const memoryId = req.params.memoryId;
    await MemoryService.deleteUserMemory(userId, memoryId);
    return res.json({
      success: true,
      message: "Memory item deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
}
