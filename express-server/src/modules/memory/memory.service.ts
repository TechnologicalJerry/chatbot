import mongoose from "mongoose";
import MemoryModel from "./memory.model";
import AppError from "../../errors/appError";
import env from "../../config/env";
import logger from "../../infrastructure/logger/logger";
import {
  memoryCreatedCounter,
  memoryDeletedCounter,
  memoryExtractionCounter,
  memoryUpdatedCounter,
} from "../../infrastructure/metrics/metrics";

export class MemoryService {
  static SENSITIVE_KEYWORDS = [
    "password",
    "passwd",
    "secret",
    "api_key",
    "apikey",
    "token",
    "bearer",
    "private_key",
    "credit_card",
    "ssn",
  ];

  static async getActiveUserMemories(userId: string, limit = 20, type?: string) {
    const query: any = { userId, status: "active" };
    if (type) {
      query.type = type;
    }
    return MemoryModel.find(query).sort({ updatedAt: -1 }).limit(limit);
  }

  static async deleteUserMemory(userId: string, memoryId: string) {
    if (!mongoose.Types.ObjectId.isValid(memoryId)) {
      throw AppError.notFound("Memory item not found");
    }
    const memory = await MemoryModel.findOne({ _id: memoryId, userId });
    if (!memory) {
      throw AppError.notFound("Memory item not found");
    }
    if (memory.status === "deleted") {
      return true;
    }
    memory.status = "deleted";
    await memory.save();
    memoryDeletedCounter.inc();
    logger.info({ userId, memoryId }, "User memory soft-deleted");
    return true;
  }

  static async extractAndStoreMemories(
    userId: string,
    conversationId: string,
    userContent: string,
    assistantContent: string
  ) {
    const lowerUserContent = userContent.toLowerCase();

    for (const keyword of MemoryService.SENSITIVE_KEYWORDS) {
      if (lowerUserContent.includes(keyword)) {
        logger.info({ userId, keyword }, "Memory extraction skipped due to sensitive keyword detection");
        memoryExtractionCounter.inc({ status: "filtered" });
        return [];
      }
    }

    const extractedCandidates = MemoryService.detectMemoryCandidates(userContent, conversationId);
    if (extractedCandidates.length === 0) {
      memoryExtractionCounter.inc({ status: "none" });
      return [];
    }

    const savedMemories = [];

    for (const candidate of extractedCandidates) {
      if (candidate.confidence < env.AI_MEMORY_CONFIDENCE_THRESHOLD) {
        continue;
      }

      const existing = await MemoryModel.findOne({
        userId,
        type: candidate.type,
        key: candidate.key,
        status: "active",
      });

      if (existing) {
        if (existing.value === candidate.value) {
          continue;
        }
        existing.status = "superseded";
        await existing.save();
        memoryUpdatedCounter.inc();
      }

      const newMemory = await MemoryModel.create({
        userId,
        conversationId,
        type: candidate.type,
        key: candidate.key,
        value: candidate.value,
        source: "conversation_extracted",
        confidence: candidate.confidence,
        status: "active",
      });

      memoryCreatedCounter.inc({ type: candidate.type });
      savedMemories.push(newMemory);

      logger.info(
        {
          userId,
          memoryId: newMemory._id,
          type: candidate.type,
          key: candidate.key,
        },
        "New memory extracted and stored"
      );
    }

    memoryExtractionCounter.inc({ status: "success" });
    return savedMemories;
  }

  static detectMemoryCandidates(text: string, conversationId: string) {
    const results: any[] = [];
    const lower = text.toLowerCase();

    if (lower.includes("i prefer ")) {
      const match = text.match(/i\s+prefer\s+([^.!?]+)/i);
      if (match && match[1].trim()) {
        const prefVal = match[1].trim();
        let key = "preference";
        if (
          prefVal.toLowerCase().includes("vegetarian") ||
          prefVal.toLowerCase().includes("vegan") ||
          prefVal.toLowerCase().includes("pescatarian")
        ) {
          key = "diet";
        } else if (
          prefVal.toLowerCase().includes("concise") ||
          prefVal.toLowerCase().includes("brief") ||
          prefVal.toLowerCase().includes("detailed")
        ) {
          key = "response_style";
        }
        results.push({
          type: "preference",
          key,
          value: prefVal,
          confidence: 0.9,
        });
      }
    }

    if (lower.includes("my goal is ")) {
      const match = text.match(/my\s+goal\s+is\s+([^.!?]+)/i);
      if (match && match[1].trim()) {
        results.push({
          type: "goal",
          key: "fitness_goal",
          value: match[1].trim(),
          confidence: 0.85,
        });
      }
    }

    if (lower.includes("i work as ")) {
      const match = text.match(/i\s+work\s+as\s+a?\s*([^.!?]+)/i);
      if (match && match[1].trim()) {
        results.push({
          type: "profile",
          key: "occupation",
          value: match[1].trim(),
          confidence: 0.85,
        });
      }
    }

    return results;
  }
}

export default MemoryService;
