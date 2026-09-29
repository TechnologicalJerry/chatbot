import { MemoryModel } from '../models/memory.model';

export class MemoryService {
  async addMemory(userId: string, fact: string, source: 'user_provided' | 'extracted' = 'user_provided', confidence = 1.0) {
    const memory = new MemoryModel({ userId, fact, source, confidence });
    return memory.save();
  }

  async getUserMemories(userId: string) {
    return MemoryModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async deleteMemory(memoryId: string, userId: string) {
    const memory = await MemoryModel.findOneAndDelete({ _id: memoryId, userId });
    return !!memory;
  }

  async extractMemoriesFromText(userId: string, text: string): Promise<string[]> {
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

    for (const fact of extracted) {
      await this.addMemory(userId, fact, 'extracted', 0.9);
    }
    return extracted;
  }
}
