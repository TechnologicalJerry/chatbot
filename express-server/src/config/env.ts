import dotenv from "dotenv";

dotenv.config();

export const env = {
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
  WORKER_CONCURRENCY: Number(process.env.WORKER_CONCURRENCY) || 5,
};

export default env;
