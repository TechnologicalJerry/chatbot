import KnowledgeChunkModel from "../../../../modules/knowledge/knowledgeChunk.model";
import KnowledgeDocumentModel from "../../../../modules/knowledge/knowledgeDocument.model";
import {
  IVectorStore,
  VectorChunkItem,
  VectorSearchResult,
  SearchOptions,
} from "./vectorStore.interface";

export class MongoVectorStore implements IVectorStore {
  async upsertChunks(chunks: VectorChunkItem[]): Promise<void> {
    for (const item of chunks) {
      await KnowledgeChunkModel.updateOne(
        { _id: item.id },
        {
          $set: {
            documentId: item.documentId,
            ownerId: item.ownerId,
            sequence: item.sequence,
            text: item.text,
            embedding: item.embedding,
            metadata: item.metadata || {},
          },
        },
        { upsert: true }
      );
    }
  }

  async similaritySearch(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<VectorSearchResult[]> {
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return [];
    }

    // 1. Fetch active document IDs owned by user
    const readyDocs = await KnowledgeDocumentModel.find({
      ownerId: options.ownerId,
      status: "ready",
    }).select("_id");

    const readyDocIds = readyDocs.map((d) => d._id);
    if (readyDocIds.length === 0) {
      return [];
    }

    // 2. Fetch candidate chunks owned by user
    const candidateChunks = await KnowledgeChunkModel.find({
      ownerId: options.ownerId,
      documentId: { $in: readyDocIds },
    }).lean();

    if (candidateChunks.length === 0) {
      return [];
    }

    // 3. Compute cosine similarity for each chunk
    const scoredResults: VectorSearchResult[] = [];

    for (const chunk of candidateChunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        continue;
      }

      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);

      if (score >= options.minScore) {
        scoredResults.push({
          chunkId: chunk._id.toString(),
          documentId: chunk.documentId.toString(),
          ownerId: chunk.ownerId.toString(),
          sequence: chunk.sequence,
          text: chunk.text,
          score,
        });
      }
    }

    // 4. Sort descending by score and return topK
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, options.topK);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await KnowledgeChunkModel.deleteMany({ documentId });
  }

  /**
   * Helper function calculating cosine similarity between vector A and vector B.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default MongoVectorStore;
