export interface VectorChunkItem {
  id: string;
  documentId: string;
  ownerId: string;
  sequence: number;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  ownerId: string;
  sequence: number;
  text: string;
  score: number;
}

export interface SearchOptions {
  ownerId: string;
  topK: number;
  minScore: number;
}

export interface IVectorStore {
  /**
   * Insert or update KnowledgeChunk items with vector embeddings.
   */
  upsertChunks(chunks: VectorChunkItem[]): Promise<void>;

  /**
   * Search for top K most relevant vector chunks matching query embedding, filtered strictly by ownerId.
   */
  similaritySearch(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<VectorSearchResult[]>;

  /**
   * Delete vector chunks belonging to a specific document ID.
   */
  deleteByDocumentId(documentId: string): Promise<void>;
}
