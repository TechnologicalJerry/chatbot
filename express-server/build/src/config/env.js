"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    PORT: Number(process.env.PORT) || 3000,
    METRICS_PORT: Number(process.env.METRICS_PORT) || 9100,
    NODE_ENV: process.env.NODE_ENV || "development",
    DB_URI: process.env.DB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/chatbot",
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    REDIS_CONNECT_TIMEOUT: Number(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    JWT_SECRET: process.env.JWT_SECRET || "supersecretkey1234567890",
    AI_MEMORY_CONFIDENCE_THRESHOLD: Number(process.env.AI_MEMORY_CONFIDENCE_THRESHOLD) || 0.7,
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    AI_ALLOWED_MODELS: process.env.AI_ALLOWED_MODELS ? process.env.AI_ALLOWED_MODELS.split(",") : ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    AI_MAX_OUTPUT_TOKENS: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 1024,
    QUEUE_PREFIX: process.env.QUEUE_PREFIX || "chatbot",
    AI_DAILY_TOKEN_LIMIT: Number(process.env.AI_DAILY_TOKEN_LIMIT) || 50000,
    AI_DAILY_REQUEST_LIMIT: Number(process.env.AI_DAILY_REQUEST_LIMIT) || 500,
    IDEMPOTENCY_TTL_SECONDS: Number(process.env.IDEMPOTENCY_TTL_SECONDS) || 86400,
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== "false",
    AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    CHAT_RATE_LIMIT_MAX: Number(process.env.CHAT_RATE_LIMIT_MAX) || 60,
    INGESTION_RATE_LIMIT_MAX: Number(process.env.INGESTION_RATE_LIMIT_MAX) || 20,
    STREAM_MAX_CONCURRENT: Number(process.env.STREAM_MAX_CONCURRENT) || 5,
    STREAM_MAX_DURATION_MS: Number(process.env.STREAM_MAX_DURATION_MS) || 60000,
    RAG_MAX_DOCUMENT_SIZE: Number(process.env.RAG_MAX_DOCUMENT_SIZE) || 500000,
    RAG_CHUNK_SIZE: Number(process.env.RAG_CHUNK_SIZE) || 500,
    RAG_CHUNK_OVERLAP: Number(process.env.RAG_CHUNK_OVERLAP) || 50,
    RAG_TOP_K: Number(process.env.RAG_TOP_K) || 5,
    RAG_SIMILARITY_THRESHOLD: Number(process.env.RAG_SIMILARITY_THRESHOLD) || 0.7,
    CACHE_DEFAULT_TTL: Number(process.env.CACHE_DEFAULT_TTL) || 300,
    WORKER_CONCURRENCY: Number(process.env.WORKER_CONCURRENCY) || 5,
};
exports.default = exports.env;
