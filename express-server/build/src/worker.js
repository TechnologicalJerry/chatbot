"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopWorkerProcess = exports.startWorkerProcess = void 0;
var bullmq_1 = require("bullmq");
var database_1 = require("./infrastructure/database/database");
var redis_client_1 = require("./infrastructure/redis/redis.client");
var env_1 = require("./config/env");
var logger_1 = __importDefault(require("./infrastructure/logger/logger"));
var queue_types_1 = require("./infrastructure/queue/queue.types");
var knowledgeDocument_model_1 = __importDefault(require("./modules/knowledge/knowledgeDocument.model"));
var knowledgeChunk_model_1 = __importDefault(require("./modules/knowledge/knowledgeChunk.model"));
var mongoVectorStore_1 = require("./infrastructure/ai/rag/vectorStore/mongoVectorStore");
var openai_embeddingProvider_1 = require("./infrastructure/ai/rag/embeddings/openai.embeddingProvider");
var memory_service_1 = __importDefault(require("./modules/memory/memory.service"));
var conversationSummary_service_1 = __importDefault(require("./infrastructure/ai/context/conversationSummary.service"));
var metrics_1 = require("./infrastructure/metrics/metrics");
var vectorStore = new mongoVectorStore_1.MongoVectorStore();
var embeddingProvider = new openai_embeddingProvider_1.OpenAIEmbeddingProvider();
var ragWorkerInstance = null;
var memoryWorkerInstance = null;
var summaryWorkerInstance = null;
function startWorkerProcess() {
    return __awaiter(this, void 0, void 0, function () {
        var redisConnection, workerOptions;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.default.info("Initializing Worker process...");
                    // 1. Connect MongoDB & Redis
                    return [4 /*yield*/, (0, database_1.connectDatabase)()];
                case 1:
                    // 1. Connect MongoDB & Redis
                    _a.sent();
                    return [4 /*yield*/, redis_client_1.redisManager.connect()];
                case 2:
                    _a.sent();
                    redisConnection = redis_client_1.redisManager.getClient();
                    workerOptions = {
                        connection: redisConnection,
                        prefix: env_1.env.QUEUE_PREFIX,
                        concurrency: env_1.env.WORKER_CONCURRENCY || 5,
                    };
                    // 2. RAG Ingestion Worker
                    ragWorkerInstance = new bullmq_1.Worker(queue_types_1.QUEUE_NAMES.RAG_INGESTION, function (job) { return __awaiter(_this, void 0, void 0, function () {
                        var timer, _a, documentId, title, content, ownerId, doc, chunkSize, overlap, textChunks, i, embeddings, vectorItems, i, chunkText, embedding, chunkDoc, err_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    timer = metrics_1.queueJobDurationHistogram.startTimer({ queue: "rag", jobType: job.name });
                                    metrics_1.queueJobsTotalCounter.inc({ queue: "rag", jobType: job.name });
                                    logger_1.default.info({ jobId: job.id, documentId: job.data.documentId }, "Processing RAG ingestion job");
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 11, , 14]);
                                    _a = job.data, documentId = _a.documentId, title = _a.title, content = _a.content, ownerId = _a.ownerId;
                                    return [4 /*yield*/, knowledgeDocument_model_1.default.findOne({ _id: documentId, ownerId: ownerId, status: { $ne: "deleted" } })];
                                case 2:
                                    doc = _b.sent();
                                    if (!doc) {
                                        logger_1.default.warn({ documentId: documentId }, "Document not found or deleted, skipping job");
                                        return [2 /*return*/];
                                    }
                                    chunkSize = env_1.env.RAG_CHUNK_SIZE || 500;
                                    overlap = env_1.env.RAG_CHUNK_OVERLAP || 50;
                                    textChunks = [];
                                    for (i = 0; i < content.length; i += chunkSize - overlap) {
                                        textChunks.push(content.substring(i, i + chunkSize));
                                    }
                                    // Clear existing chunks if any
                                    return [4 /*yield*/, knowledgeChunk_model_1.default.deleteMany({ documentId: documentId, ownerId: ownerId })];
                                case 3:
                                    // Clear existing chunks if any
                                    _b.sent();
                                    return [4 /*yield*/, embeddingProvider.embedTexts(textChunks)];
                                case 4:
                                    embeddings = _b.sent();
                                    vectorItems = [];
                                    i = 0;
                                    _b.label = 5;
                                case 5:
                                    if (!(i < textChunks.length)) return [3 /*break*/, 8];
                                    chunkText = textChunks[i];
                                    embedding = embeddings[i] || [];
                                    return [4 /*yield*/, knowledgeChunk_model_1.default.create({
                                            documentId: documentId,
                                            ownerId: ownerId,
                                            sequence: i + 1,
                                            text: chunkText,
                                            embedding: embedding,
                                            tokenCount: Math.ceil(chunkText.length / 4),
                                        })];
                                case 6:
                                    chunkDoc = _b.sent();
                                    vectorItems.push({
                                        id: chunkDoc._id.toString(),
                                        documentId: documentId,
                                        ownerId: ownerId,
                                        sequence: i + 1,
                                        text: chunkText,
                                        embedding: embedding,
                                    });
                                    _b.label = 7;
                                case 7:
                                    i++;
                                    return [3 /*break*/, 5];
                                case 8: return [4 /*yield*/, vectorStore.upsertChunks(vectorItems)];
                                case 9:
                                    _b.sent();
                                    // Update document status to ready
                                    doc.status = "ready";
                                    doc.chunkCount = textChunks.length;
                                    return [4 /*yield*/, doc.save()];
                                case 10:
                                    _b.sent();
                                    timer();
                                    metrics_1.queueJobsCompletedCounter.inc({ queue: "rag", jobType: job.name });
                                    logger_1.default.info({ jobId: job.id, documentId: documentId, chunksCreated: textChunks.length }, "RAG ingestion completed");
                                    return [3 /*break*/, 14];
                                case 11:
                                    err_1 = _b.sent();
                                    timer();
                                    metrics_1.queueJobsFailedCounter.inc({ queue: "rag", jobType: job.name });
                                    if (!(job.attemptsMade >= (job.opts.attempts || 3) - 1)) return [3 /*break*/, 13];
                                    return [4 /*yield*/, knowledgeDocument_model_1.default.updateOne({ _id: job.data.documentId }, { status: "failed" })];
                                case 12:
                                    _b.sent();
                                    _b.label = 13;
                                case 13:
                                    logger_1.default.error({ err: err_1.message, jobId: job.id }, "RAG ingestion job failed");
                                    throw err_1;
                                case 14: return [2 /*return*/];
                            }
                        });
                    }); }, workerOptions);
                    // 3. Memory Extraction Worker
                    memoryWorkerInstance = new bullmq_1.Worker(queue_types_1.QUEUE_NAMES.MEMORY_EXTRACTION, function (job) { return __awaiter(_this, void 0, void 0, function () {
                        var timer, _a, userId, conversationId, userContent, assistantContent, err_2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    timer = metrics_1.queueJobDurationHistogram.startTimer({ queue: "memory", jobType: job.name });
                                    metrics_1.queueJobsTotalCounter.inc({ queue: "memory", jobType: job.name });
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 3, , 4]);
                                    _a = job.data, userId = _a.userId, conversationId = _a.conversationId, userContent = _a.userContent, assistantContent = _a.assistantContent;
                                    return [4 /*yield*/, memory_service_1.default.extractAndStoreMemories(userId, conversationId, userContent, assistantContent)];
                                case 2:
                                    _b.sent();
                                    timer();
                                    metrics_1.queueJobsCompletedCounter.inc({ queue: "memory", jobType: job.name });
                                    return [3 /*break*/, 4];
                                case 3:
                                    err_2 = _b.sent();
                                    timer();
                                    metrics_1.queueJobsFailedCounter.inc({ queue: "memory", jobType: job.name });
                                    logger_1.default.error({ err: err_2.message, jobId: job.id }, "Memory extraction job failed");
                                    throw err_2;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); }, workerOptions);
                    // 4. Conversation Summary Worker
                    summaryWorkerInstance = new bullmq_1.Worker(queue_types_1.QUEUE_NAMES.CONVERSATION_SUMMARY, function (job) { return __awaiter(_this, void 0, void 0, function () {
                        var timer, conversationId, err_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    timer = metrics_1.queueJobDurationHistogram.startTimer({ queue: "summary", jobType: job.name });
                                    metrics_1.queueJobsTotalCounter.inc({ queue: "summary", jobType: job.name });
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    conversationId = job.data.conversationId;
                                    return [4 /*yield*/, conversationSummary_service_1.default.generateAndUpdateSummary(conversationId)];
                                case 2:
                                    _a.sent();
                                    timer();
                                    metrics_1.queueJobsCompletedCounter.inc({ queue: "summary", jobType: job.name });
                                    return [3 /*break*/, 4];
                                case 3:
                                    err_3 = _a.sent();
                                    timer();
                                    metrics_1.queueJobsFailedCounter.inc({ queue: "summary", jobType: job.name });
                                    logger_1.default.error({ err: err_3.message, jobId: job.id }, "Summary generation job failed");
                                    throw err_3;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); }, workerOptions);
                    logger_1.default.info("Worker process initialized and listening for jobs.");
                    return [2 /*return*/];
            }
        });
    });
}
exports.startWorkerProcess = startWorkerProcess;
function stopWorkerProcess() {
    return __awaiter(this, void 0, void 0, function () {
        var workers, _i, workers_1, w, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger_1.default.info("Stopping Worker process...");
                    workers = [ragWorkerInstance, memoryWorkerInstance, summaryWorkerInstance];
                    _i = 0, workers_1 = workers;
                    _b.label = 1;
                case 1:
                    if (!(_i < workers_1.length)) return [3 /*break*/, 6];
                    w = workers_1[_i];
                    if (!w) return [3 /*break*/, 5];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, w.close()];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [4 /*yield*/, redis_client_1.redisManager.disconnect()];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, database_1.disconnectDatabase)()];
                case 8:
                    _b.sent();
                    logger_1.default.info("Worker process stopped cleanly.");
                    return [2 /*return*/];
            }
        });
    });
}
exports.stopWorkerProcess = stopWorkerProcess;
if (require.main === module) {
    startWorkerProcess().catch(function (err) {
        logger_1.default.error({ err: err }, "Worker process startup error");
        process.exit(1);
    });
    var handleShutdown_1 = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.default.info("Received ".concat(signal, ", initiating graceful worker shutdown..."));
                    return [4 /*yield*/, stopWorkerProcess()];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    }); };
    process.on("SIGTERM", function () { return handleShutdown_1("SIGTERM"); });
    process.on("SIGINT", function () { return handleShutdown_1("SIGINT"); });
}
