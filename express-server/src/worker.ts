import { Worker, Job } from "bullmq";
import { connectDatabase, disconnectDatabase } from "./infrastructure/database/database";
import { redisManager } from "./infrastructure/redis/redis.client";
import { env } from "./config/env";
import logger from "./infrastructure/logger/logger";
import {
  QUEUE_NAMES,
  JOB_NAMES,
  RagIngestionJobData,
  MemoryExtractionJobData,
  ConversationSummaryJobData,
} from "./infrastructure/queue/queue.types";

import KnowledgeDocumentModel from "./modules/knowledge/knowledgeDocument.model";
import KnowledgeChunkModel from "./modules/knowledge/knowledgeChunk.model";
import { MongoVectorStore } from "./infrastructure/ai/rag/vectorStore/mongoVectorStore";
import { OpenAIEmbeddingProvider } from "./infrastructure/ai/rag/embeddings/openai.embeddingProvider";
import MemoryService from "./modules/memory/memory.service";
import ConversationSummaryService from "./infrastructure/ai/context/conversationSummary.service";
import {
  queueJobsTotalCounter,
  queueJobsCompletedCounter,
  queueJobsFailedCounter,
  queueJobDurationHistogram,
} from "./infrastructure/metrics/metrics";

const vectorStore = new MongoVectorStore();
const embeddingProvider = new OpenAIEmbeddingProvider();

let ragWorkerInstance: Worker | null = null;
let memoryWorkerInstance: Worker | null = null;
let summaryWorkerInstance: Worker | null = null;

export async function startWorkerProcess(): Promise<void> {
  logger.info("Initializing Worker process...");

  // 1. Connect MongoDB & Redis
  await connectDatabase();
  await redisManager.connect();

  const redisConnection = redisManager.getClient();
  const workerOptions = {
    connection: redisConnection,
    prefix: env.QUEUE_PREFIX,
    concurrency: env.WORKER_CONCURRENCY || 5,
  };

  // 2. RAG Ingestion Worker
  ragWorkerInstance = new Worker<RagIngestionJobData>(
    QUEUE_NAMES.RAG_INGESTION,
    async (job: Job<RagIngestionJobData>) => {
      const timer = queueJobDurationHistogram.startTimer({ queue: "rag", jobType: job.name });
      queueJobsTotalCounter.inc({ queue: "rag", jobType: job.name });

      logger.info({ jobId: job.id, documentId: job.data.documentId }, "Processing RAG ingestion job");

      try {
        const { documentId, title, content, ownerId } = job.data;

        // Check if document exists and is not deleted
        const doc = await KnowledgeDocumentModel.findOne({ _id: documentId, ownerId, status: { $ne: "deleted" } });
        if (!doc) {
          logger.warn({ documentId }, "Document not found or deleted, skipping job");
          return;
        }

        // Chunk text
        const chunkSize = env.RAG_CHUNK_SIZE || 500;
        const overlap = env.RAG_CHUNK_OVERLAP || 50;
        const textChunks: string[] = [];

        for (let i = 0; i < content.length; i += chunkSize - overlap) {
          textChunks.push(content.substring(i, i + chunkSize));
        }

        // Clear existing chunks if any
        await KnowledgeChunkModel.deleteMany({ documentId, ownerId });

        // Generate embeddings and store
        const embeddings = await embeddingProvider.embedTexts(textChunks);

        const vectorItems = [];
        for (let i = 0; i < textChunks.length; i++) {
          const chunkText = textChunks[i];
          const embedding = embeddings[i] || [];

          const chunkDoc = await KnowledgeChunkModel.create({
            documentId,
            ownerId,
            sequence: i + 1,
            text: chunkText,
            embedding,
            tokenCount: Math.ceil(chunkText.length / 4),
          });

          vectorItems.push({
            id: chunkDoc._id.toString(),
            documentId,
            ownerId,
            sequence: i + 1,
            text: chunkText,
            embedding,
          });
        }

        await vectorStore.upsertChunks(vectorItems);

        // Update document status to ready
        doc.status = "ready";
        doc.chunkCount = textChunks.length;
        await doc.save();

        timer();
        queueJobsCompletedCounter.inc({ queue: "rag", jobType: job.name });
        logger.info({ jobId: job.id, documentId, chunksCreated: textChunks.length }, "RAG ingestion completed");
      } catch (err: any) {
        timer();
        queueJobsFailedCounter.inc({ queue: "rag", jobType: job.name });

        // Update document status to failed if max attempts reached
        if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
          await KnowledgeDocumentModel.updateOne({ _id: job.data.documentId }, { status: "failed" });
        }

        logger.error({ err: err.message, jobId: job.id }, "RAG ingestion job failed");
        throw err;
      }
    },
    workerOptions
  );

  // 3. Memory Extraction Worker
  memoryWorkerInstance = new Worker<MemoryExtractionJobData>(
    QUEUE_NAMES.MEMORY_EXTRACTION,
    async (job: Job<MemoryExtractionJobData>) => {
      const timer = queueJobDurationHistogram.startTimer({ queue: "memory", jobType: job.name });
      queueJobsTotalCounter.inc({ queue: "memory", jobType: job.name });

      try {
        const { userId, conversationId, userContent, assistantContent } = job.data;
        await MemoryService.extractAndStoreMemories(userId, conversationId, userContent, assistantContent);
        timer();
        queueJobsCompletedCounter.inc({ queue: "memory", jobType: job.name });
      } catch (err: any) {
        timer();
        queueJobsFailedCounter.inc({ queue: "memory", jobType: job.name });
        logger.error({ err: err.message, jobId: job.id }, "Memory extraction job failed");
        throw err;
      }
    },
    workerOptions
  );

  // 4. Conversation Summary Worker
  summaryWorkerInstance = new Worker<ConversationSummaryJobData>(
    QUEUE_NAMES.CONVERSATION_SUMMARY,
    async (job: Job<ConversationSummaryJobData>) => {
      const timer = queueJobDurationHistogram.startTimer({ queue: "summary", jobType: job.name });
      queueJobsTotalCounter.inc({ queue: "summary", jobType: job.name });

      try {
        const { conversationId } = job.data;
        await ConversationSummaryService.generateAndUpdateSummary(conversationId);
        timer();
        queueJobsCompletedCounter.inc({ queue: "summary", jobType: job.name });
      } catch (err: any) {
        timer();
        queueJobsFailedCounter.inc({ queue: "summary", jobType: job.name });
        logger.error({ err: err.message, jobId: job.id }, "Summary generation job failed");
        throw err;
      }
    },
    workerOptions
  );

  logger.info("Worker process initialized and listening for jobs.");
}

export async function stopWorkerProcess(): Promise<void> {
  logger.info("Stopping Worker process...");

  const workers = [ragWorkerInstance, memoryWorkerInstance, summaryWorkerInstance];
  for (const w of workers) {
    if (w) {
      try {
        await w.close();
      } catch {
        // ignore
      }
    }
  }

  await redisManager.disconnect();
  await disconnectDatabase();
  logger.info("Worker process stopped cleanly.");
}

if (require.main === module) {
  startWorkerProcess().catch((err) => {
    logger.error({ err }, "Worker process startup error");
    process.exit(1);
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, initiating graceful worker shutdown...`);
    await stopWorkerProcess();
    process.exit(0);
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}
