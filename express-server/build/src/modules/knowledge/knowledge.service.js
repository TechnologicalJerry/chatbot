"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const knowledgeDocument_model_1 = __importDefault(require("./knowledgeDocument.model"));
const knowledgeChunk_model_1 = __importDefault(require("./knowledgeChunk.model"));
const openai_embeddingProvider_1 = require("../../infrastructure/ai/rag/embeddings/openai.embeddingProvider");
const mongoVectorStore_1 = require("../../infrastructure/ai/rag/vectorStore/mongoVectorStore");
const tokenCounter_1 = require("../../infrastructure/ai/context/tokenCounter");
const appError_1 = require("../../errors/appError");
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
const metrics_1 = require("../../infrastructure/metrics/metrics");
class KnowledgeService {
    static embeddingProvider = new openai_embeddingProvider_1.OpenAIEmbeddingProvider();
    static vectorStore = new mongoVectorStore_1.MongoVectorStore();
    /**
     * Ingest text document: normalize, SHA-256 hash, chunk, embed, and store in VectorStore.
     */
    static async ingestDocument(ownerId, input) {
        if (input.content.length > env_1.env.RAG_MAX_DOCUMENT_SIZE) {
            throw appError_1.AppError.badRequest(`Document content exceeds maximum allowed size of ${env_1.env.RAG_MAX_DOCUMENT_SIZE} characters`);
        }
        // 1. Normalize text and generate SHA-256 content hash
        const normalizedText = input.content.trim();
        const contentHash = crypto_1.default.createHash("sha256").update(normalizedText).digest("hex");
        // 2. Check for duplicate document
        const existingDoc = await knowledgeDocument_model_1.default.findOne({
            ownerId,
            contentHash,
            status: { $ne: "deleted" },
        });
        if (existingDoc) {
            throw appError_1.AppError.badRequest("Document with identical content already exists");
        }
        // 3. Create document record in "processing" state
        const document = await knowledgeDocument_model_1.default.create({
            ownerId,
            title: input.title,
            sourceType: input.sourceType || "text",
            contentHash,
            status: "processing",
        });
        try {
            // 4. Chunk document text
            const rawChunks = KnowledgeService.chunkText(normalizedText, env_1.env.RAG_CHUNK_SIZE, env_1.env.RAG_CHUNK_OVERLAP);
            // 5. Generate embeddings for chunks
            const embeddings = await KnowledgeService.embeddingProvider.embedTexts(rawChunks);
            // 6. Persist chunks in database and VectorStore
            const vectorChunkItems = [];
            for (let i = 0; i < rawChunks.length; i++) {
                const chunkText = rawChunks[i];
                const embedding = embeddings[i] || [];
                const tokenCount = tokenCounter_1.TokenCounter.countTokens(chunkText);
                const chunkDoc = await knowledgeChunk_model_1.default.create({
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
            metrics_1.ragIngestionCounter.inc();
            logger_1.default.info({ documentId: document._id, ownerId, chunkCount: rawChunks.length }, "Knowledge document ingested successfully");
            return document;
        }
        catch (err) {
            document.status = "failed";
            await document.save();
            logger_1.default.error({ err, documentId: document._id }, "Failed to process document ingestion");
            throw err;
        }
    }
    /**
     * List active documents owned by user.
     */
    static async getUserDocuments(ownerId) {
        return knowledgeDocument_model_1.default.find({ ownerId, status: { $ne: "deleted" } }).sort({
            createdAt: -1,
        });
    }
    /**
     * Delete document and invalidate searchable chunks.
     */
    static async deleteDocument(ownerId, documentId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(documentId)) {
            throw appError_1.AppError.notFound("Document not found");
        }
        const document = await knowledgeDocument_model_1.default.findOne({ _id: documentId, ownerId });
        if (!document || document.status === "deleted") {
            throw appError_1.AppError.notFound("Document not found");
        }
        document.status = "deleted";
        await document.save();
        await KnowledgeService.vectorStore.deleteByDocumentId(documentId);
        await knowledgeChunk_model_1.default.deleteMany({ documentId });
        logger_1.default.info({ documentId, ownerId }, "Knowledge document deleted and chunks removed");
        return true;
    }
    /**
     * Paragraph and sentence-aware text chunker.
     */
    static chunkText(text, chunkSize, overlap) {
        if (!text)
            return [];
        const chunks = [];
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
exports.KnowledgeService = KnowledgeService;
exports.default = KnowledgeService;
