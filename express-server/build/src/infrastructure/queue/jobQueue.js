"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueueManager = exports.JobQueueManager = void 0;
const bullmq_1 = require("bullmq");
const redis_client_1 = require("../redis/redis.client");
const queue_types_1 = require("./queue.types");
const logger_1 = __importDefault(require("../logger/logger"));
const env_1 = require("../../config/env");
class JobQueueManager {
    static instance;
    ragQueue = null;
    memoryQueue = null;
    summaryQueue = null;
    constructor() { }
    static getInstance() {
        if (!JobQueueManager.instance) {
            JobQueueManager.instance = new JobQueueManager();
        }
        return JobQueueManager.instance;
    }
    getQueueOptions() {
        return {
            connection: redis_client_1.redisManager.getClient(),
            prefix: env_1.env.QUEUE_PREFIX,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
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
    getRagQueue() {
        if (!this.ragQueue) {
            this.ragQueue = new bullmq_1.Queue(queue_types_1.QUEUE_NAMES.RAG_INGESTION, this.getQueueOptions());
        }
        return this.ragQueue;
    }
    getMemoryQueue() {
        if (!this.memoryQueue) {
            this.memoryQueue = new bullmq_1.Queue(queue_types_1.QUEUE_NAMES.MEMORY_EXTRACTION, this.getQueueOptions());
        }
        return this.memoryQueue;
    }
    getSummaryQueue() {
        if (!this.summaryQueue) {
            this.summaryQueue = new bullmq_1.Queue(queue_types_1.QUEUE_NAMES.CONVERSATION_SUMMARY, this.getQueueOptions());
        }
        return this.summaryQueue;
    }
    async enqueueRagIngestion(data) {
        const queue = this.getRagQueue();
        // Deterministic jobId ensures idempotency: same document content won't create duplicate active jobs
        const jobId = `rag:${data.documentId}:${data.contentHash}`;
        const job = await queue.add(queue_types_1.JOB_NAMES.PROCESS_RAG_DOCUMENT, data, { jobId });
        logger_1.default.info({ jobId: job.id, documentId: data.documentId }, "Enqueued RAG ingestion job");
        return job.id || jobId;
    }
    async enqueueMemoryExtraction(data) {
        const queue = this.getMemoryQueue();
        const job = await queue.add(queue_types_1.JOB_NAMES.EXTRACT_MEMORIES, data);
        logger_1.default.info({ jobId: job.id, userId: data.userId }, "Enqueued memory extraction job");
        return job.id || "memory-job";
    }
    async enqueueConversationSummary(data) {
        const queue = this.getSummaryQueue();
        const jobId = `summary:${data.conversationId}`;
        const job = await queue.add(queue_types_1.JOB_NAMES.GENERATE_SUMMARY, data, { jobId });
        logger_1.default.info({ jobId: job.id, conversationId: data.conversationId }, "Enqueued conversation summary job");
        return job.id || jobId;
    }
    async closeAll() {
        const queues = [this.ragQueue, this.memoryQueue, this.summaryQueue];
        for (const q of queues) {
            if (q) {
                try {
                    await q.close();
                }
                catch {
                    // ignore
                }
            }
        }
        this.ragQueue = null;
        this.memoryQueue = null;
        this.summaryQueue = null;
    }
}
exports.JobQueueManager = JobQueueManager;
exports.jobQueueManager = JobQueueManager.getInstance();
