import { Queue, JobsOptions } from "bullmq";
import { redisManager } from "../redis/redis.client";
import {
  QUEUE_NAMES,
  JOB_NAMES,
  RagIngestionJobData,
  MemoryExtractionJobData,
  ConversationSummaryJobData,
} from "./queue.types";
import logger from "../logger/logger";
import { env } from "../../config/env";

export class JobQueueManager {
  private static instance: JobQueueManager;
  private ragQueue: Queue | null = null;
  private memoryQueue: Queue | null = null;
  private summaryQueue: Queue | null = null;

  private constructor() {}

  public static getInstance(): JobQueueManager {
    if (!JobQueueManager.instance) {
      JobQueueManager.instance = new JobQueueManager();
    }
    return JobQueueManager.instance;
  }

  private getQueueOptions() {
    return {
      connection: redisManager.getClient(),
      prefix: env.QUEUE_PREFIX,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential" as const,
          delay: 1000,
        },
        removeOnComplete: {
          count: 500, // Retain max 500 completed jobs
        },
        removeOnFail: {
          count: 1000, // Retain max 1000 failed jobs for diagnosis
        },
      },
    };
  }

  public getRagQueue(): Queue {
    if (!this.ragQueue) {
      this.ragQueue = new Queue(QUEUE_NAMES.RAG_INGESTION, this.getQueueOptions());
    }
    return this.ragQueue;
  }

  public getMemoryQueue(): Queue {
    if (!this.memoryQueue) {
      this.memoryQueue = new Queue(QUEUE_NAMES.MEMORY_EXTRACTION, this.getQueueOptions());
    }
    return this.memoryQueue;
  }

  public getSummaryQueue(): Queue {
    if (!this.summaryQueue) {
      this.summaryQueue = new Queue(QUEUE_NAMES.CONVERSATION_SUMMARY, this.getQueueOptions());
    }
    return this.summaryQueue;
  }

  public async enqueueRagIngestion(data: RagIngestionJobData): Promise<string> {
    const queue = this.getRagQueue();
    // Deterministic jobId ensures idempotency: same document content won't create duplicate active jobs
    const jobId = `rag:${data.documentId}:${data.contentHash}`;
    const job = await queue.add(JOB_NAMES.PROCESS_RAG_DOCUMENT, data, { jobId });
    logger.info({ jobId: job.id, documentId: data.documentId }, "Enqueued RAG ingestion job");
    return job.id || jobId;
  }

  public async enqueueMemoryExtraction(data: MemoryExtractionJobData): Promise<string> {
    const queue = this.getMemoryQueue();
    const job = await queue.add(JOB_NAMES.EXTRACT_MEMORIES, data);
    logger.info({ jobId: job.id, userId: data.userId }, "Enqueued memory extraction job");
    return job.id || "memory-job";
  }

  public async enqueueConversationSummary(data: ConversationSummaryJobData): Promise<string> {
    const queue = this.getSummaryQueue();
    const jobId = `summary:${data.conversationId}`;
    const job = await queue.add(JOB_NAMES.GENERATE_SUMMARY, data, { jobId });
    logger.info({ jobId: job.id, conversationId: data.conversationId }, "Enqueued conversation summary job");
    return job.id || jobId;
  }

  public async closeAll(): Promise<void> {
    const queues = [this.ragQueue, this.memoryQueue, this.summaryQueue];
    for (const q of queues) {
      if (q) {
        try {
          await q.close();
        } catch {
          // ignore
        }
      }
    }
    this.ragQueue = null;
    this.memoryQueue = null;
    this.summaryQueue = null;
  }
}

export const jobQueueManager = JobQueueManager.getInstance();
