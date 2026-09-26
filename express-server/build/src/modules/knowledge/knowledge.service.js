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
exports.KnowledgeService = void 0;
var crypto_1 = __importDefault(require("crypto"));
var mongoose_1 = __importDefault(require("mongoose"));
var knowledgeDocument_model_1 = __importDefault(require("./knowledgeDocument.model"));
var knowledgeChunk_model_1 = __importDefault(require("./knowledgeChunk.model"));
var openai_embeddingProvider_1 = require("../../infrastructure/ai/rag/embeddings/openai.embeddingProvider");
var mongoVectorStore_1 = require("../../infrastructure/ai/rag/vectorStore/mongoVectorStore");
var tokenCounter_1 = require("../../infrastructure/ai/context/tokenCounter");
var appError_1 = require("../../errors/appError");
var env_1 = require("../../config/env");
var logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
var metrics_1 = require("../../infrastructure/metrics/metrics");
var KnowledgeService = /** @class */ (function () {
    function KnowledgeService() {
    }
    /**
     * Ingest text document: normalize, SHA-256 hash, chunk, embed, and store in VectorStore.
     */
    KnowledgeService.ingestDocument = function (ownerId, input) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedText, contentHash, existingDoc, document, rawChunks, embeddings, vectorChunkItems, i, chunkText, embedding, tokenCount, chunkDoc, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (input.content.length > env_1.env.RAG_MAX_DOCUMENT_SIZE) {
                            throw appError_1.AppError.badRequest("Document content exceeds maximum allowed size of ".concat(env_1.env.RAG_MAX_DOCUMENT_SIZE, " characters"));
                        }
                        normalizedText = input.content.trim();
                        contentHash = crypto_1.default.createHash("sha256").update(normalizedText).digest("hex");
                        return [4 /*yield*/, knowledgeDocument_model_1.default.findOne({
                                ownerId: ownerId,
                                contentHash: contentHash,
                                status: { $ne: "deleted" },
                            })];
                    case 1:
                        existingDoc = _a.sent();
                        if (existingDoc) {
                            throw appError_1.AppError.badRequest("Document with identical content already exists", undefined, "DUPLICATE_DOCUMENT");
                        }
                        return [4 /*yield*/, knowledgeDocument_model_1.default.create({
                                ownerId: ownerId,
                                title: input.title,
                                sourceType: input.sourceType || "text",
                                contentHash: contentHash,
                                status: "processing",
                            })];
                    case 2:
                        document = _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 11, , 13]);
                        rawChunks = KnowledgeService.chunkText(normalizedText, env_1.env.RAG_CHUNK_SIZE, env_1.env.RAG_CHUNK_OVERLAP);
                        return [4 /*yield*/, KnowledgeService.embeddingProvider.embedTexts(rawChunks)];
                    case 4:
                        embeddings = _a.sent();
                        vectorChunkItems = [];
                        i = 0;
                        _a.label = 5;
                    case 5:
                        if (!(i < rawChunks.length)) return [3 /*break*/, 8];
                        chunkText = rawChunks[i];
                        embedding = embeddings[i] || [];
                        tokenCount = tokenCounter_1.TokenCounter.countTokens(chunkText);
                        return [4 /*yield*/, knowledgeChunk_model_1.default.create({
                                documentId: document._id,
                                ownerId: ownerId,
                                sequence: i + 1,
                                text: chunkText,
                                embedding: embedding,
                                tokenCount: tokenCount,
                            })];
                    case 6:
                        chunkDoc = _a.sent();
                        vectorChunkItems.push({
                            id: chunkDoc._id.toString(),
                            documentId: document._id.toString(),
                            ownerId: ownerId,
                            sequence: i + 1,
                            text: chunkText,
                            embedding: embedding,
                        });
                        _a.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 5];
                    case 8: return [4 /*yield*/, KnowledgeService.vectorStore.upsertChunks(vectorChunkItems)];
                    case 9:
                        _a.sent();
                        // 7. Update document status to "ready"
                        document.status = "ready";
                        document.chunkCount = rawChunks.length;
                        return [4 /*yield*/, document.save()];
                    case 10:
                        _a.sent();
                        metrics_1.ragIngestionCounter.inc();
                        logger_1.default.info({ documentId: document._id, ownerId: ownerId, chunkCount: rawChunks.length }, "Knowledge document ingested successfully");
                        return [2 /*return*/, document];
                    case 11:
                        err_1 = _a.sent();
                        document.status = "failed";
                        return [4 /*yield*/, document.save()];
                    case 12:
                        _a.sent();
                        logger_1.default.error({ err: err_1, documentId: document._id }, "Failed to process document ingestion");
                        throw err_1;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * List active documents owned by user.
     */
    KnowledgeService.getUserDocuments = function (ownerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, knowledgeDocument_model_1.default.find({ ownerId: ownerId, status: { $ne: "deleted" } }).sort({
                        createdAt: -1,
                    })];
            });
        });
    };
    /**
     * Delete document and invalidate searchable chunks.
     */
    KnowledgeService.deleteDocument = function (ownerId, documentId) {
        return __awaiter(this, void 0, void 0, function () {
            var document;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_1.default.Types.ObjectId.isValid(documentId)) {
                            throw appError_1.AppError.notFound("Document not found");
                        }
                        return [4 /*yield*/, knowledgeDocument_model_1.default.findOne({ _id: documentId, ownerId: ownerId })];
                    case 1:
                        document = _a.sent();
                        if (!document || document.status === "deleted") {
                            throw appError_1.AppError.notFound("Document not found");
                        }
                        document.status = "deleted";
                        return [4 /*yield*/, document.save()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, KnowledgeService.vectorStore.deleteByDocumentId(documentId)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, knowledgeChunk_model_1.default.deleteMany({ documentId: documentId })];
                    case 4:
                        _a.sent();
                        logger_1.default.info({ documentId: documentId, ownerId: ownerId }, "Knowledge document deleted and chunks removed");
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Paragraph and sentence-aware text chunker.
     */
    KnowledgeService.chunkText = function (text, chunkSize, overlap) {
        if (!text)
            return [];
        var chunks = [];
        var startIndex = 0;
        while (startIndex < text.length) {
            var endIndex = Math.min(startIndex + chunkSize, text.length);
            // Avoid breaking mid-sentence if not at the end of text
            if (endIndex < text.length) {
                var lastPeriod = text.lastIndexOf(".", endIndex);
                var lastNewline = text.lastIndexOf("\n", endIndex);
                var bestBoundary = Math.max(lastPeriod, lastNewline);
                if (bestBoundary > startIndex + Math.floor(chunkSize * 0.5)) {
                    endIndex = bestBoundary + 1;
                }
            }
            var chunk = text.slice(startIndex, endIndex).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }
            if (endIndex >= text.length) {
                break;
            }
            startIndex = Math.max(endIndex - overlap, startIndex + 1);
        }
        return chunks;
    };
    KnowledgeService.embeddingProvider = new openai_embeddingProvider_1.OpenAIEmbeddingProvider();
    KnowledgeService.vectorStore = new mongoVectorStore_1.MongoVectorStore();
    return KnowledgeService;
}());
exports.KnowledgeService = KnowledgeService;
exports.default = KnowledgeService;
