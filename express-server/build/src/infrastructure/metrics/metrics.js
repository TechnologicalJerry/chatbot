"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopMetricsServer = exports.startMetricsServer = exports.queueJobDurationHistogram = exports.queueJobsFailedCounter = exports.queueJobsCompletedCounter = exports.queueJobsTotalCounter = exports.securityDocumentAccessDenialsCounter = exports.securityToolDenialsCounter = exports.securityQuotaRejectionsCounter = exports.securityRateLimitRejectionsCounter = exports.securityAuthorizationFailuresCounter = exports.securityAuthFailuresCounter = exports.aiToolCallTimeoutsCounter = exports.aiToolCallErrorsCounter = exports.aiToolCallDurationHistogram = exports.aiToolCallsCounter = exports.ragChunksRetrievedCounter = exports.ragRetrievalDurationHistogram = exports.ragRetrievalCounter = exports.ragEmbeddingErrorsCounter = exports.ragEmbeddingCounter = exports.ragIngestionCounter = exports.memoryExtractionCounter = exports.memoryDeletedCounter = exports.memoryUpdatedCounter = exports.memoryCreatedCounter = exports.contextMemoryUsedCounter = exports.contextSummaryUsedCounter = exports.contextBuildDurationHistogram = exports.contextBuildCounter = exports.chatStreamTTFTHistogram = exports.chatStreamRequestsCounter = exports.aiTokensCounter = exports.aiRequestDurationHistogram = exports.aiRequestsCounter = exports.messagesReadCounter = exports.messagesCreatedCounter = exports.conversationDeletedCounter = exports.conversationCreatedCounter = exports.databaseResponseTimeHistogram = exports.restResponseTimeHistogram = void 0;
const express_1 = __importDefault(require("express"));
const prom_client_1 = __importDefault(require("prom-client"));
const logger_1 = __importDefault(require("../logger/logger"));
const env_1 = __importDefault(require("../../config/env"));
const app = (0, express_1.default)();
let metricsServerInstance = null;
exports.restResponseTimeHistogram = new prom_client_1.default.Histogram({
    name: "rest_response_time_duration_seconds",
    help: "REST API response time in seconds",
    labelNames: ["method", "route", "status_code"],
});
exports.databaseResponseTimeHistogram = new prom_client_1.default.Histogram({
    name: "db_response_time_duration_seconds",
    help: "Database response time in seconds",
    labelNames: ["operation", "success"],
});
exports.conversationCreatedCounter = new prom_client_1.default.Counter({
    name: "conversation_created_total",
    help: "Total number of conversations created",
});
exports.conversationDeletedCounter = new prom_client_1.default.Counter({
    name: "conversation_deleted_total",
    help: "Total number of conversations deleted",
});
exports.messagesCreatedCounter = new prom_client_1.default.Counter({
    name: "messages_created_total",
    help: "Total number of messages created",
});
exports.messagesReadCounter = new prom_client_1.default.Counter({
    name: "messages_read_total",
    help: "Total number of message list queries",
});
exports.aiRequestsCounter = new prom_client_1.default.Counter({
    name: "ai_requests_total",
    help: "Total number of AI completion requests",
    labelNames: ["model", "status"],
});
exports.aiRequestDurationHistogram = new prom_client_1.default.Histogram({
    name: "ai_request_duration_seconds",
    help: "AI provider request duration in seconds",
    labelNames: ["model"],
});
exports.aiTokensCounter = new prom_client_1.default.Counter({
    name: "ai_tokens_total",
    help: "Total AI tokens consumed",
    labelNames: ["type"],
});
exports.chatStreamRequestsCounter = new prom_client_1.default.Counter({
    name: "chat_stream_requests_total",
    help: "Total number of chat stream requests",
    labelNames: ["status"],
});
exports.chatStreamTTFTHistogram = new prom_client_1.default.Histogram({
    name: "chat_stream_time_to_first_token_seconds",
    help: "Time to first token (TTFT) in seconds for streaming responses",
    labelNames: ["model"],
});
exports.contextBuildCounter = new prom_client_1.default.Counter({
    name: "context_build_total",
    help: "Total number of AIContext builds",
});
exports.contextBuildDurationHistogram = new prom_client_1.default.Histogram({
    name: "context_build_duration_seconds",
    help: "Duration of AIContext building in seconds",
});
exports.contextSummaryUsedCounter = new prom_client_1.default.Counter({
    name: "context_summary_used_total",
    help: "Total number of conversation summaries generated or used",
});
exports.contextMemoryUsedCounter = new prom_client_1.default.Counter({
    name: "context_memory_used_total",
    help: "Total number of memory items included in AIContext",
});
exports.memoryCreatedCounter = new prom_client_1.default.Counter({
    name: "memory_created_total",
    help: "Total number of user memories created",
    labelNames: ["type"],
});
exports.memoryUpdatedCounter = new prom_client_1.default.Counter({
    name: "memory_updated_total",
    help: "Total number of user memories updated/superseded",
});
exports.memoryDeletedCounter = new prom_client_1.default.Counter({
    name: "memory_deleted_total",
    help: "Total number of user memories deleted",
});
exports.memoryExtractionCounter = new prom_client_1.default.Counter({
    name: "memory_extraction_total",
    help: "Total number of memory extractions attempted",
    labelNames: ["status"],
});
exports.ragIngestionCounter = new prom_client_1.default.Counter({
    name: "rag_ingestion_total",
    help: "Total number of knowledge documents ingested",
});
exports.ragEmbeddingCounter = new prom_client_1.default.Counter({
    name: "rag_embedding_total",
    help: "Total number of RAG text chunks embedded",
});
exports.ragEmbeddingErrorsCounter = new prom_client_1.default.Counter({
    name: "rag_embedding_errors_total",
    help: "Total number of RAG embedding errors",
});
exports.ragRetrievalCounter = new prom_client_1.default.Counter({
    name: "rag_retrieval_total",
    help: "Total number of RAG retrieval queries performed",
});
exports.ragRetrievalDurationHistogram = new prom_client_1.default.Histogram({
    name: "rag_retrieval_duration_seconds",
    help: "Duration of RAG knowledge retrieval in seconds",
});
exports.ragChunksRetrievedCounter = new prom_client_1.default.Counter({
    name: "rag_chunks_retrieved_total",
    help: "Total number of RAG chunks retrieved",
});
exports.aiToolCallsCounter = new prom_client_1.default.Counter({
    name: "ai_tool_calls_total",
    help: "Total number of tool calls executed",
    labelNames: ["tool"],
});
exports.aiToolCallDurationHistogram = new prom_client_1.default.Histogram({
    name: "ai_tool_call_duration_seconds",
    help: "Duration of tool call execution in seconds",
    labelNames: ["tool"],
});
exports.aiToolCallErrorsCounter = new prom_client_1.default.Counter({
    name: "ai_tool_call_errors_total",
    help: "Total number of tool call execution errors",
    labelNames: ["tool"],
});
exports.aiToolCallTimeoutsCounter = new prom_client_1.default.Counter({
    name: "ai_tool_call_timeouts_total",
    help: "Total number of tool call execution timeouts",
    labelNames: ["tool"],
});
exports.securityAuthFailuresCounter = new prom_client_1.default.Counter({
    name: "security_auth_failures_total",
    help: "Total number of authentication failures",
});
exports.securityAuthorizationFailuresCounter = new prom_client_1.default.Counter({
    name: "security_authorization_failures_total",
    help: "Total number of authorization failures",
});
exports.securityRateLimitRejectionsCounter = new prom_client_1.default.Counter({
    name: "security_rate_limit_rejections_total",
    help: "Total number of rate limit rejections",
    labelNames: ["type"],
});
exports.securityQuotaRejectionsCounter = new prom_client_1.default.Counter({
    name: "security_quota_rejections_total",
    help: "Total number of AI token/request quota rejections",
    labelNames: ["type"],
});
exports.securityToolDenialsCounter = new prom_client_1.default.Counter({
    name: "security_tool_denials_total",
    help: "Total number of tool execution denials",
    labelNames: ["reason"],
});
exports.securityDocumentAccessDenialsCounter = new prom_client_1.default.Counter({
    name: "security_document_access_denials_total",
    help: "Total number of unauthorized document access attempts",
});
exports.queueJobsTotalCounter = new prom_client_1.default.Counter({
    name: "queue_jobs_total",
    help: "Total number of background queue jobs enqueued",
    labelNames: ["queue", "jobType"],
});
exports.queueJobsCompletedCounter = new prom_client_1.default.Counter({
    name: "queue_jobs_completed_total",
    help: "Total number of background queue jobs completed successfully",
    labelNames: ["queue", "jobType"],
});
exports.queueJobsFailedCounter = new prom_client_1.default.Counter({
    name: "queue_jobs_failed_total",
    help: "Total number of background queue jobs failed",
    labelNames: ["queue", "jobType"],
});
exports.queueJobDurationHistogram = new prom_client_1.default.Histogram({
    name: "queue_job_duration_seconds",
    help: "Duration of background queue job execution in seconds",
    labelNames: ["queue", "jobType"],
});
function startMetricsServer() {
    prom_client_1.default.collectDefaultMetrics();
    app.get("/metrics", async (req, res) => {
        res.set("Content-Type", prom_client_1.default.register.contentType);
        return res.send(await prom_client_1.default.register.metrics());
    });
    const port = env_1.default.METRICS_PORT || 9100;
    metricsServerInstance = app.listen(port, () => {
        logger_1.default.info(`Metrics server started at http://localhost:${port}`);
    });
    return metricsServerInstance;
}
exports.startMetricsServer = startMetricsServer;
function stopMetricsServer() {
    return new Promise((resolve) => {
        if (metricsServerInstance) {
            metricsServerInstance.close(() => {
                logger_1.default.info("Metrics server closed");
                resolve();
            });
        }
        else {
            resolve();
        }
    });
}
exports.stopMetricsServer = stopMetricsServer;
