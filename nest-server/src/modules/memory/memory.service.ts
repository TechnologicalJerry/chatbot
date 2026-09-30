import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Memory, MemoryDocument } from './memory.schema';

@Injectable()
export class MemoryService {
  constructor(@InjectModel(Memory.name) private memoryModel: Model<MemoryDocument>) {}

  async addMemory(userId: string, fact: string, source = 'user_provided', confidence = 1.0) {
    const memory = new this.memoryModel({ userId, fact, source, confidence });
    return memory.save();
  }

  async getUserMemories(userId: string) {
    return this.memoryModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async deleteMemory(memoryId: string, userId: string) {
    const memory = await this.memoryModel.findOne({ _id: memoryId, userId });
    if (!memory) {
      throw new NotFoundException('Memory item not found');
    }
    await this.memoryModel.findByIdAndDelete(memoryId).exec();
    return { success: true, message: 'Memory deleted' };
  }

  async extractMemoriesFromText(userId: string, text: string): Promise<string[]> {
    // Simple heuristic memory extraction: look for "my name is X", "I prefer Y", "I live in Z"
    const extracted: string[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('my name is ')) {
      const match = text.match(/my name is ([^,.]+)/i);
      if (match) extracted.push(`User name is ${match[1].trim()}`);
    }
    if (lower.includes('i live in ')) {
      const match = text.match(/i live in ([^,.]+)/i);
      if (match) extracted.push(`User lives in ${match[1].trim()}`);
    }
    if (lower.includes('i prefer ')) {
      const match = text.match(/i prefer ([^,.]+)/i);
      if (match) extracted.push(`User prefers ${match[1].trim()}`);
    }

    for (const fact of extracted) {
      await this.addMemory(userId, fact, 'extracted', 0.9);
    }

    return extracted;
  }
}
