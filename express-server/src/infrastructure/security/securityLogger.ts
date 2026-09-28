import logger from "../logger/logger";
import {
  securityAuthFailuresCounter,
  securityAuthorizationFailuresCounter,
  securityRateLimitRejectionsCounter,
  securityQuotaRejectionsCounter,
  securityToolDenialsCounter,
  securityDocumentAccessDenialsCounter,
} from "../metrics/metrics";

export type SecurityEventType =
  | "AUTH_FAILURE"
  | "AUTHORIZATION_FAILURE"
  | "RATE_LIMIT_EXCEEDED"
  | "QUOTA_EXCEEDED"
  | "TOOL_DENIAL"
  | "DOCUMENT_ACCESS_DENIAL"
  | "PROMPT_INJECTION_DETECTED"
  | "PAYLOAD_TOO_LARGE";

export interface SecurityEventOptions {
  eventType: SecurityEventType;
  requestId?: string;
  userId?: string;
  ip?: string;
  endpoint?: string;
  details?: Record<string, any>;
}

function sanitizeData(data: Record<string, any>): Record<string, any> {
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

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function logSecurityEvent(options: SecurityEventOptions): void {
  const { eventType, requestId, userId, ip, endpoint, details = {} } = options;

  const sanitizedDetails = sanitizeData(details);

  logger.warn(
    {
      securityEvent: eventType,
      requestId: requestId || "unknown",
      userId: userId || "anonymous",
      ip: ip || "unknown",
      endpoint: endpoint || "unknown",
      details: sanitizedDetails,
      timestamp: new Date().toISOString(),
    },
    `[SECURITY EVENT] ${eventType}`
  );

  // Update corresponding security metrics
  switch (eventType) {
    case "AUTH_FAILURE":
      securityAuthFailuresCounter.inc();
      break;
    case "AUTHORIZATION_FAILURE":
      securityAuthorizationFailuresCounter.inc();
      break;
    case "RATE_LIMIT_EXCEEDED":
      securityRateLimitRejectionsCounter.inc({ type: sanitizedDetails.type || "general" });
      break;
    case "QUOTA_EXCEEDED":
      securityQuotaRejectionsCounter.inc({ type: sanitizedDetails.type || "token" });
      break;
    case "TOOL_DENIAL":
      securityToolDenialsCounter.inc({ reason: sanitizedDetails.reason || "unauthorized" });
      break;
    case "DOCUMENT_ACCESS_DENIAL":
      securityDocumentAccessDenialsCounter.inc();
      break;
    default:
      break;
  }
}
