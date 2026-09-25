"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurityEvent = void 0;
var logger_1 = __importDefault(require("../logger/logger"));
var metrics_1 = require("../metrics/metrics");
function sanitizeData(data) {
    var SENSITIVE_KEYS = [
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
    var sanitized = {};
    var _loop_1 = function (key, value) {
        var lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some(function (s) { return lowerKey.includes(s); })) {
            sanitized[key] = "[REDACTED]";
        }
        else if (value && typeof value === "object" && !Array.isArray(value)) {
            sanitized[key] = sanitizeData(value);
        }
        else {
            sanitized[key] = value;
        }
    };
    for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        _loop_1(key, value);
    }
    return sanitized;
}
function logSecurityEvent(options) {
    var eventType = options.eventType, requestId = options.requestId, userId = options.userId, ip = options.ip, endpoint = options.endpoint, _a = options.details, details = _a === void 0 ? {} : _a;
    var sanitizedDetails = sanitizeData(details);
    logger_1.default.warn({
        securityEvent: eventType,
        requestId: requestId || "unknown",
        userId: userId || "anonymous",
        ip: ip || "unknown",
        endpoint: endpoint || "unknown",
        details: sanitizedDetails,
        timestamp: new Date().toISOString(),
    }, "[SECURITY EVENT] ".concat(eventType));
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
