"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopWorkerProcess = exports.startWorkerProcess = void 0;
const bullmq_1 = require("bullmq");
const database_1 = require("./infrastructure/database/database");
const redis_client_1 = require("./infrastructure/redis/redis.client");
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./infrastructure/logger/logger"));
const queue_types_1 = require("./infrastructure/queue/queue.types");
const knowledgeDocument_model_1 = __importDefault(require("./modules/knowledge/knowledgeDocument.model"));
const knowledgeChunk_model_1 = __importDefault(require("./modules/knowledge/knowledgeChunk.model"));
const mongoVectorStore_1 = require("./infrastructure/ai/rag/vectorStore/mongoVectorStore");
const openai_embeddingProvider_1 = require("./infrastructure/ai/rag/embeddings/openai.embeddingProvider");
const memory_service_1 = __importDefault(require("./modules/memory/memory.service"));
const conversationSummary_service_1 = __importDefault(require("./infrastructure/ai/context/conversationSummary.service"));
const metrics_1 = require("./infrastructure/metrics/metrics");
const vectorStore = new mongoVectorStore_1.MongoVectorStore();
const embeddingProvider = new openai_embeddingProvider_1.OpenAIEmbeddingProvider();
let ragWorkerInstance = null;
let memoryWorkerInstance = null;
let summaryWorkerInstance = null;
async function startWorkerProcess() {
    logger_1.default.info("Initializing Worker process...");
    // 1. Connect MongoDB & Redis
    await (0, database_1.connectDatabase)();
    await redis_client_1.redisManager.connect();
    const redisConnection = redis_client_1.redisManager.getClient();
    const workerOptions = {
        connection: redisConnection,
        prefix: env_1.env.QUEUE_PREFIX,
        concurrency: env_1.env.WORKER_CONCURRENCY || 5,
    };
    // 2. RAG Ingestion Worker
    ragWorkerInstance = new bullmq_1.Worker(queue_types_1.QUEUE_NAMES.RAG_INGESTION, async (job) => {
        const timer = metrics_1.queueJobDurationHistogram.startTimer({ queue: "rag", jobType: job.name });
        metrics_1.queueJobsTotalCounter.inc({ queue: "rag", jobType: job.name });
        logger_1.default.info({ jobId: job.id, documentId: job.data.documentId }, "Processing RAG ingestion job");
        try {
            const { documentId, title, content, ownerId } = job.data;
            // Check if document exists and is not deleted
            const doc = await knowledgeDocument_model_1.default.findOne({ _id: documentId, ownerId, status: { $ne: "deleted" } });
            if (!doc) {
                logger_1.default.warn({ documentId }, "Document not found or deleted, skipping job");
                return;
            }
            // Chunk text
            const chunkSize = env_1.env.RAG_CHUNK_SIZE || 500;
            const overlap = env_1.env.RAG_CHUNK_OVERLAP || 50;
            const textChunks = [];
            for (let i = 0; i < content.length; i += chunkSize - overlap) {
                textChunks.push(content.substring(i, i + chunkSize));
            }
            // Clear existing chunks if any
            await knowledgeChunk_model_1.default.deleteMany({ documentId, ownerId });
            // Generate embeddings and store
            const embeddings = await embeddingProvider.embedTexts(textChunks);
            const vectorItems = [];
            for (let i = 0; i < textChunks.length; i++) {
                const chunkText = textChunks[i];
                const embedding = embeddings[i] || [];
                const chunkDoc = await knowledgeChunk_model_1.default.create({
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
            metrics_1.queueJobsCompletedCounter.inc({ queue: "rag", jobType: job.name });
            logger_1.default.info({ jobId: job.id, documentId, chunksCreated: textChunks.length }, "RAG ingestion completed");
        }
        catch (err) {
            timer();
            metrics_1.queueJobsFailedCounter.inc({ queue: "rag", jobType: job.name });
            // Update document status to failed if max attempts reached
            if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
                await knowledgeDocument_model_1.default.updateOne({ _id: job.data.documentId }, { status: "failed" });
            }
            logger_1.default.error({ err: err.message, jobId: job.id }, "RAG ingestion job failed");
            throw err;
        }
    }, workerOptions);
    // 3. Memory Extraction Worker
    memoryWorkerInstance = new bullmq_1.Worker(queue_types_1.QUEUE_NAMES.MEMORY_EXTRACTION, async (job) => {
        const timer = metrics_1.queueJobDurationHistogram.startTimer({ queue: "memory", jobType: job.name });
        metrics_1.queueJobsTotalCounter.inc({ queue: "memory", jobType: job.name });
        try {
            const { userId, conversationId, userContent, assistantContent } = job.data;
            await memory_service_1.default.extractAndStoreMemories(userId, conversationId, userContent, assistantContent || "");
            timer();
            metrics_1.queueJobsCompletedCounter.inc({ queue: "memory", jobType: job.name });
        }
        catch (err) {
            timer();
            metrics_1.queueJobsFailedCounter.inc({ queue: "memory", jobType: job.name });
            logger_1.default.error({ err: err.message, jobId: job.id }, "Memory extraction job failed");
            throw err;
        }
    }, workerOptions);
    // 4. Conversation Summary Worker
    summaryWorkerInstance = new bullmq_1.Worker(queue_types_1.QUEUE_NAMES.CONVERSATION_SUMMARY, async (job) => {
        const timer = metrics_1.queueJobDurationHistogram.startTimer({ queue: "summary", jobType: job.name });
        metrics_1.queueJobsTotalCounter.inc({ queue: "summary", jobType: job.name });
        try {
            const { conversationId } = job.data;
            await conversationSummary_service_1.default.generateAndUpdateSummary(conversationId);
            timer();
            metrics_1.queueJobsCompletedCounter.inc({ queue: "summary", jobType: job.name });
        }
        catch (err) {
            timer();
            metrics_1.queueJobsFailedCounter.inc({ queue: "summary", jobType: job.name });
            logger_1.default.error({ err: err.message, jobId: job.id }, "Summary generation job failed");
            throw err;
        }
    }, workerOptions);
    logger_1.default.info("Worker process initialized and listening for jobs.");
}
exports.startWorkerProcess = startWorkerProcess;
async function stopWorkerProcess() {
    logger_1.default.info("Stopping Worker process...");
    const workers = [ragWorkerInstance, memoryWorkerInstance, summaryWorkerInstance];
    for (const w of workers) {
        if (w) {
            try {
                await w.close();
            }
            catch {
                // ignore
            }
        }
    }
    await redis_client_1.redisManager.disconnect();
    await (0, database_1.disconnectDatabase)();
    logger_1.default.info("Worker process stopped cleanly.");
}
exports.stopWorkerProcess = stopWorkerProcess;
if (require.main === module) {
    startWorkerProcess().catch((err) => {
        logger_1.default.error({ err }, "Worker process startup error");
        process.exit(1);
    });
    const handleShutdown = async (signal) => {
        logger_1.default.info(`Received ${signal}, initiating graceful worker shutdown...`);
        await stopWorkerProcess();
        process.exit(0);
    };
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
}
