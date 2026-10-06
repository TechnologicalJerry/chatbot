import express, { Request, Response } from "express";
import client from "prom-client";
import logger from "../logger/logger";
import env from "../../config/env";
import { Server } from "http";

const app = express();
let metricsServerInstance: Server | null = null;

export const restResponseTimeHistogram = new client.Histogram({
  name: "rest_response_time_duration_seconds",
  help: "REST API response time in seconds",
  labelNames: ["method", "route", "status_code"],
});

export const databaseResponseTimeHistogram = new client.Histogram({
  name: "db_response_time_duration_seconds",
  help: "Database response time in seconds",
  labelNames: ["operation", "success"],
});

export const conversationCreatedCounter = new client.Counter({
  name: "conversation_created_total",
  help: "Total number of conversations created",
});

export const conversationDeletedCounter = new client.Counter({
  name: "conversation_deleted_total",
  help: "Total number of conversations deleted",
});

export const messagesCreatedCounter = new client.Counter({
  name: "messages_created_total",
  help: "Total number of messages created",
});

export const messagesReadCounter = new client.Counter({
  name: "messages_read_total",
  help: "Total number of message list queries",
});

export const aiRequestsCounter = new client.Counter({
  name: "ai_requests_total",
  help: "Total number of AI completion requests",
  labelNames: ["model", "status"],
});

export const aiRequestDurationHistogram = new client.Histogram({
  name: "ai_request_duration_seconds",
  help: "AI provider request duration in seconds",
  labelNames: ["model"],
});

export const aiTokensCounter = new client.Counter({
  name: "ai_tokens_total",
  help: "Total AI tokens consumed",
  labelNames: ["type"],
});

export const chatStreamRequestsCounter = new client.Counter({
  name: "chat_stream_requests_total",
  help: "Total number of chat stream requests",
  labelNames: ["status"],
});

export const chatStreamTTFTHistogram = new client.Histogram({
  name: "chat_stream_time_to_first_token_seconds",
  help: "Time to first token (TTFT) in seconds for streaming responses",
  labelNames: ["model"],
});

export const contextBuildCounter = new client.Counter({
  name: "context_build_total",
  help: "Total number of AIContext builds",
});

export const contextBuildDurationHistogram = new client.Histogram({
  name: "context_build_duration_seconds",
  help: "Duration of AIContext building in seconds",
});

export const contextSummaryUsedCounter = new client.Counter({
  name: "context_summary_used_total",
  help: "Total number of conversation summaries generated or used",
});

export const contextMemoryUsedCounter = new client.Counter({
  name: "context_memory_used_total",
  help: "Total number of memory items included in AIContext",
});

export const memoryCreatedCounter = new client.Counter({
  name: "memory_created_total",
  help: "Total number of user memories created",
  labelNames: ["type"],
});

export const memoryUpdatedCounter = new client.Counter({
  name: "memory_updated_total",
  help: "Total number of user memories updated/superseded",
});

export const memoryDeletedCounter = new client.Counter({
  name: "memory_deleted_total",
  help: "Total number of user memories deleted",
});

export const memoryExtractionCounter = new client.Counter({
  name: "memory_extraction_total",
  help: "Total number of memory extractions attempted",
  labelNames: ["status"],
});

export const ragIngestionCounter = new client.Counter({
  name: "rag_ingestion_total",
  help: "Total number of knowledge documents ingested",
});

export const ragEmbeddingCounter = new client.Counter({
  name: "rag_embedding_total",
  help: "Total number of RAG text chunks embedded",
});

export const ragEmbeddingErrorsCounter = new client.Counter({
  name: "rag_embedding_errors_total",
  help: "Total number of RAG embedding errors",
});

export const ragRetrievalCounter = new client.Counter({
  name: "rag_retrieval_total",
  help: "Total number of RAG retrieval queries performed",
});

export const ragRetrievalDurationHistogram = new client.Histogram({
  name: "rag_retrieval_duration_seconds",
  help: "Duration of RAG knowledge retrieval in seconds",
});

export const ragChunksRetrievedCounter = new client.Counter({
  name: "rag_chunks_retrieved_total",
  help: "Total number of RAG chunks retrieved",
});

export const aiToolCallsCounter = new client.Counter({
  name: "ai_tool_calls_total",
  help: "Total number of tool calls executed",
  labelNames: ["tool"],
});

export const aiToolCallDurationHistogram = new client.Histogram({
  name: "ai_tool_call_duration_seconds",
  help: "Duration of tool call execution in seconds",
  labelNames: ["tool"],
});

export const aiToolCallErrorsCounter = new client.Counter({
  name: "ai_tool_call_errors_total",
  help: "Total number of tool call execution errors",
  labelNames: ["tool"],
});

export const aiToolCallTimeoutsCounter = new client.Counter({
  name: "ai_tool_call_timeouts_total",
  help: "Total number of tool call execution timeouts",
  labelNames: ["tool"],
});

export const securityAuthFailuresCounter = new client.Counter({
  name: "security_auth_failures_total",
  help: "Total number of authentication failures",
});

export const securityAuthorizationFailuresCounter = new client.Counter({
  name: "security_authorization_failures_total",
  help: "Total number of authorization failures",
});

export const securityRateLimitRejectionsCounter = new client.Counter({
  name: "security_rate_limit_rejections_total",
  help: "Total number of rate limit rejections",
  labelNames: ["type"],
});

export const securityQuotaRejectionsCounter = new client.Counter({
  name: "security_quota_rejections_total",
  help: "Total number of AI token/request quota rejections",
  labelNames: ["type"],
});

export const securityToolDenialsCounter = new client.Counter({
  name: "security_tool_denials_total",
  help: "Total number of tool execution denials",
  labelNames: ["reason"],
});

export const securityDocumentAccessDenialsCounter = new client.Counter({
  name: "security_document_access_denials_total",
  help: "Total number of unauthorized document access attempts",
});

export const queueJobsTotalCounter = new client.Counter({
  name: "queue_jobs_total",
  help: "Total number of background queue jobs enqueued",
  labelNames: ["queue", "jobType"],
});

export const queueJobsCompletedCounter = new client.Counter({
  name: "queue_jobs_completed_total",
  help: "Total number of background queue jobs completed successfully",
  labelNames: ["queue", "jobType"],
});

export const queueJobsFailedCounter = new client.Counter({
  name: "queue_jobs_failed_total",
  help: "Total number of background queue jobs failed",
  labelNames: ["queue", "jobType"],
});

export const queueJobDurationHistogram = new client.Histogram({
  name: "queue_job_duration_seconds",
  help: "Duration of background queue job execution in seconds",
  labelNames: ["queue", "jobType"],
});

export function startMetricsServer() {
  client.collectDefaultMetrics();

  app.get("/metrics", async (req: Request, res: Response) => {
    res.set("Content-Type", client.register.contentType);
    return res.send(await client.register.metrics());
  });

  const port = env.METRICS_PORT || 9100;
  metricsServerInstance = app.listen(port, () => {
    logger.info(`Metrics server started at http://localhost:${port}`);
  });
  return metricsServerInstance;
}

export function stopMetricsServer() {
  return new Promise<void>((resolve) => {
    if (metricsServerInstance) {
      metricsServerInstance.close(() => {
        logger.info("Metrics server closed");
        resolve();
      });
    } else {
      resolve();
    }
  });
}
