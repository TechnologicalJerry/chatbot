import crypto from "crypto";
import mongoose from "mongoose";
import KnowledgeDocumentModel, {
  KnowledgeDocumentDocument,
  DocumentSourceType,
} from "./knowledgeDocument.model";
import KnowledgeChunkModel from "./knowledgeChunk.model";
import { OpenAIEmbeddingProvider } from "../../infrastructure/ai/rag/embeddings/openai.embeddingProvider";
import { MongoVectorStore } from "../../infrastructure/ai/rag/vectorStore/mongoVectorStore";
import { TokenCounter } from "../../infrastructure/ai/context/tokenCounter";
import { AppError } from "../../errors/appError";
import { env } from "../../config/env";
import logger from "../../infrastructure/logger/logger";
import { ragIngestionCounter } from "../../infrastructure/metrics/metrics";

export class KnowledgeService {
  private static embeddingProvider = new OpenAIEmbeddingProvider();
  private static vectorStore = new MongoVectorStore();

  /**
   * Ingest text document: normalize, SHA-256 hash, chunk, embed, and store in VectorStore.
   */
  public static async ingestDocument(
    ownerId: string,
    input: { title: string; content: string; sourceType?: DocumentSourceType }
  ): Promise<KnowledgeDocumentDocument> {
    if (input.content.length > env.RAG_MAX_DOCUMENT_SIZE) {
      throw AppError.badRequest(
        `Document content exceeds maximum allowed size of ${env.RAG_MAX_DOCUMENT_SIZE} characters`
      );
    }

    // 1. Normalize text and generate SHA-256 content hash
    const normalizedText = input.content.trim();
    const contentHash = crypto.createHash("sha256").update(normalizedText).digest("hex");

    // 2. Check for duplicate document
    const existingDoc = await KnowledgeDocumentModel.findOne({
      ownerId,
      contentHash,
      status: { $ne: "deleted" },
    });

    if (existingDoc) {
      throw AppError.badRequest("Document with identical content already exists", undefined, "DUPLICATE_DOCUMENT");
    }

    // 3. Create document record in "processing" state
    const document = await KnowledgeDocumentModel.create({
      ownerId,
      title: input.title,
      sourceType: input.sourceType || "text",
      contentHash,
      status: "processing",
    });

    try {
      // 4. Chunk document text
      const rawChunks = KnowledgeService.chunkText(
        normalizedText,
        env.RAG_CHUNK_SIZE,
        env.RAG_CHUNK_OVERLAP
      );

      // 5. Generate embeddings for chunks
      const embeddings = await KnowledgeService.embeddingProvider.embedTexts(rawChunks);

      // 6. Persist chunks in database and VectorStore
      const vectorChunkItems = [];
      for (let i = 0; i < rawChunks.length; i++) {
        const chunkText = rawChunks[i];
        const embedding = embeddings[i] || [];
        const tokenCount = TokenCounter.countTokens(chunkText);

        const chunkDoc = await KnowledgeChunkModel.create({
          documentId: document._id,
          ownerId,
          sequence: i + 1,
          text: chunkText,
          embedding,
          tokenCount,
        });

        vectorChunkItems.push({
          id: chunkDoc._id.toString(),
          documentId: document._id.toString(),
          ownerId,
          sequence: i + 1,
          text: chunkText,
          embedding,
        });
      }

      await KnowledgeService.vectorStore.upsertChunks(vectorChunkItems);

      // 7. Update document status to "ready"
      document.status = "ready";
      document.chunkCount = rawChunks.length;
      await document.save();

      ragIngestionCounter.inc();

      logger.info(
        { documentId: document._id, ownerId, chunkCount: rawChunks.length },
        "Knowledge document ingested successfully"
      );

      return document;
    } catch (err: any) {
      document.status = "failed";
      await document.save();
      logger.error({ err, documentId: document._id }, "Failed to process document ingestion");
      throw err;
    }
  }

  /**
   * List active documents owned by user.
   */
  public static async getUserDocuments(ownerId: string): Promise<KnowledgeDocumentDocument[]> {
    return KnowledgeDocumentModel.find({ ownerId, status: { $ne: "deleted" } }).sort({
      createdAt: -1,
    });
  }

  /**
   * Delete document and invalidate searchable chunks.
   */
  public static async deleteDocument(ownerId: string, documentId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw AppError.notFound("Document not found");
    }

    const document = await KnowledgeDocumentModel.findOne({ _id: documentId, ownerId });
    if (!document || document.status === "deleted") {
      throw AppError.notFound("Document not found");
    }

    document.status = "deleted";
    await document.save();

    await KnowledgeService.vectorStore.deleteByDocumentId(documentId);
    await KnowledgeChunkModel.deleteMany({ documentId });

    logger.info({ documentId, ownerId }, "Knowledge document deleted and chunks removed");
    return true;
  }

  /**
   * Paragraph and sentence-aware text chunker.
   */
  public static chunkText(text: string, chunkSize: number, overlap: number): string[] {
    if (!text) return [];

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + chunkSize, text.length);

      // Avoid breaking mid-sentence if not at the end of text
      if (endIndex < text.length) {
        const lastPeriod = text.lastIndexOf(".", endIndex);
        const lastNewline = text.lastIndexOf("\n", endIndex);
        const bestBoundary = Math.max(lastPeriod, lastNewline);

        if (bestBoundary > startIndex + Math.floor(chunkSize * 0.5)) {
          endIndex = bestBoundary + 1;
        }
      }

      const chunk = text.slice(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      if (endIndex >= text.length) {
        break;
      }

      startIndex = Math.max(endIndex - overlap, startIndex + 1);
    }

    return chunks;
  }
}

export default KnowledgeService;
