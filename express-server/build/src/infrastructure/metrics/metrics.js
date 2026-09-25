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
exports.stopMetricsServer = exports.startMetricsServer = exports.queueJobDurationHistogram = exports.queueJobsFailedCounter = exports.queueJobsCompletedCounter = exports.queueJobsTotalCounter = exports.securityDocumentAccessDenialsCounter = exports.securityToolDenialsCounter = exports.securityQuotaRejectionsCounter = exports.securityRateLimitRejectionsCounter = exports.securityAuthorizationFailuresCounter = exports.securityAuthFailuresCounter = exports.aiToolCallTimeoutsCounter = exports.aiToolCallErrorsCounter = exports.aiToolCallDurationHistogram = exports.aiToolCallsCounter = exports.ragChunksRetrievedCounter = exports.ragRetrievalDurationHistogram = exports.ragRetrievalCounter = exports.ragEmbeddingErrorsCounter = exports.ragEmbeddingCounter = exports.ragIngestionCounter = exports.memoryExtractionCounter = exports.memoryDeletedCounter = exports.memoryUpdatedCounter = exports.memoryCreatedCounter = exports.contextMemoryUsedCounter = exports.contextSummaryUsedCounter = exports.contextBuildDurationHistogram = exports.contextBuildCounter = exports.chatStreamTTFTHistogram = exports.chatStreamRequestsCounter = exports.aiTokensCounter = exports.aiRequestDurationHistogram = exports.aiRequestsCounter = exports.messagesReadCounter = exports.messagesCreatedCounter = exports.conversationDeletedCounter = exports.conversationCreatedCounter = exports.databaseResponseTimeHistogram = exports.restResponseTimeHistogram = void 0;
var express_1 = __importDefault(require("express"));
var prom_client_1 = __importDefault(require("prom-client"));
var logger_1 = __importDefault(require("../logger/logger"));
var env_1 = require("../../config/env");
var app = (0, express_1.default)();
var metricsServerInstance = null;
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
    var _this = this;
    var collectDefaultMetrics = prom_client_1.default.collectDefaultMetrics;
    collectDefaultMetrics();
    app.get("/metrics", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    res.set("Content-Type", prom_client_1.default.register.contentType);
                    _b = (_a = res).send;
                    return [4 /*yield*/, prom_client_1.default.register.metrics()];
                case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
            }
        });
    }); });
    var port = env_1.env.METRICS_PORT || 9100;
    metricsServerInstance = app.listen(port, function () {
        logger_1.default.info("Metrics server started at http://localhost:".concat(port));
    });
    return metricsServerInstance;
}
exports.startMetricsServer = startMetricsServer;
function stopMetricsServer() {
    return new Promise(function (resolve) {
        if (metricsServerInstance) {
            metricsServerInstance.close(function () {
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
