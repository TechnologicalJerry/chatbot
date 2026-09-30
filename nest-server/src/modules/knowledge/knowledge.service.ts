import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KnowledgeDocumentClass, KnowledgeDocumentDocument } from './knowledge-doc.schema';
import { KnowledgeChunk, KnowledgeChunkDocument } from './knowledge-chunk.schema';
import { RagEngineService } from '../../infrastructure/ai/rag-engine.service';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectModel(KnowledgeDocumentClass.name) private docModel: Model<KnowledgeDocumentDocument>,
    @InjectModel(KnowledgeChunk.name) private chunkModel: Model<KnowledgeChunkDocument>,
    private ragEngine: RagEngineService,
  ) {}

  async uploadDocument(userId: string, title: string, content: string) {
    const doc = new this.docModel({ userId, title, content, chunkCount: 0 });
    await doc.save();

    // Simple chunking into ~300 char blocks
    const chunksText: string[] = [];
    const chunkSize = 300;
    for (let i = 0; i < content.length; i += chunkSize) {
      chunksText.push(content.substring(i, i + chunkSize));
    }

    const chunkDocs = chunksText.map((chunk) => ({
      documentId: doc._id,
      userId,
      content: chunk,
      vector: this.ragEngine.mockEmbedding(chunk),
    }));

    await this.chunkModel.insertMany(chunkDocs);
    doc.chunkCount = chunkDocs.length;
    await doc.save();

    return doc;
  }

  async searchSimilar(userId: string, queryText: string, limit: number = 3) {
    const queryVector = this.ragEngine.mockEmbedding(queryText);
    const userChunks = await this.chunkModel.find({ userId }).exec();

    const scored = userChunks.map((chunk) => {
      const score = this.ragEngine.cosineSimilarity(queryVector, chunk.vector);
      return {
        chunkId: chunk._id.toString(),
        documentId: chunk.documentId.toString(),
        content: chunk.content,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  async getUserDocuments(userId: string) {
    return this.docModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async deleteDocument(documentId: string, userId: string) {
    const doc = await this.docModel.findOne({ _id: documentId, userId });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await Promise.all([
      this.docModel.findByIdAndDelete(documentId).exec(),
      this.chunkModel.deleteMany({ documentId }).exec(),
    ]);

    return { success: true, message: 'Document deleted' };
  }
}
