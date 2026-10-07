"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurityEvent = void 0;
const logger_1 = __importDefault(require("../logger/logger"));
const metrics_1 = require("../metrics/metrics");
function sanitizeData(data) {
    const SENSITIVE_KEYS = [
        "password",
        "token",
        "accesstoken",
        "refreshtoken",
        "authorization",
        "secret",
        "apikey",
        "openai_api_key",
        "key",
    ];
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
            sanitized[key] = "[REDACTED]";
        }
        else if (value && typeof value === "object" && !Array.isArray(value)) {
            sanitized[key] = sanitizeData(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
function logSecurityEvent(options) {
    const { eventType, requestId, userId, ip, endpoint, details = {} } = options;
    const sanitizedDetails = sanitizeData(details);
    logger_1.default.warn({
        securityEvent: eventType,
        requestId: requestId || "unknown",
        userId: userId || "anonymous",
        ip: ip || "unknown",
        endpoint: endpoint || "unknown",
        details: sanitizedDetails,
        timestamp: new Date().toISOString(),
    }, `[SECURITY EVENT] ${eventType}`);
    // Update corresponding security metrics
    switch (eventType) {
        case "AUTH_FAILURE":
            metrics_1.securityAuthFailuresCounter.inc();
            break;
        case "AUTHORIZATION_FAILURE":
            metrics_1.securityAuthorizationFailuresCounter.inc();
            break;
        case "RATE_LIMIT_EXCEEDED":
            metrics_1.securityRateLimitRejectionsCounter.inc({ type: sanitizedDetails.type || "general" });
            break;
        case "QUOTA_EXCEEDED":
            metrics_1.securityQuotaRejectionsCounter.inc({ type: sanitizedDetails.type || "token" });
            break;
        case "TOOL_DENIAL":
            metrics_1.securityToolDenialsCounter.inc({ reason: sanitizedDetails.reason || "unauthorized" });
            break;
        case "DOCUMENT_ACCESS_DENIAL":
            metrics_1.securityDocumentAccessDenialsCounter.inc();
            break;
        default:
            break;
    }
}
exports.logSecurityEvent = logSecurityEvent;
