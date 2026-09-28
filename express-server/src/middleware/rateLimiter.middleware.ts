import { Request, Response, NextFunction } from "express";
import { defaultRateLimiter, IRateLimiter } from "../infrastructure/security/rateLimiter";
import { logSecurityEvent } from "../infrastructure/security/securityLogger";
import { env } from "../config/env";
import { HEADER_REQUEST_ID } from "../config/constants";

export interface RateLimiterMiddlewareOptions {
  windowMs: number;
  maxHits: number;
  rateLimitType: string;
  keyGenerator?: (req: Request) => string;
  rateLimiter?: IRateLimiter;
}

export function createRateLimiterMiddleware(options: RateLimiterMiddlewareOptions) {
  const {
    windowMs,
    maxHits,
    rateLimitType,
    keyGenerator = (req: Request) => {
      const user = resGetLocalUser(req);
      return user?._id || req.ip || "unknown";
    },
    rateLimiter = defaultRateLimiter,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!env.RATE_LIMIT_ENABLED) {
      return next();
    }

    const key = `${rateLimitType}:${keyGenerator(req)}`;
    const result = await rateLimiter.consume(key, windowMs, maxHits);

    res.setHeader("X-RateLimit-Limit", result.maxHits);
    res.setHeader("X-RateLimit-Remaining", result.remainingHits);
    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTimeMs / 1000));

    if (!result.allowed) {
      const requestId = (req.headers[HEADER_REQUEST_ID] || res.getHeader(HEADER_REQUEST_ID) || "unknown") as string;
      const userId = resGetLocalUser(req)?._id;

      logSecurityEvent({
        eventType: "RATE_LIMIT_EXCEEDED",
        requestId,
        userId,
        ip: req.ip,
        endpoint: req.originalUrl,
        details: { type: rateLimitType, currentHits: result.currentHits, maxHits: result.maxHits },
      });

      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests for ${rateLimitType}. Please try again later.`,
        },
        requestId,
      });
    }

    return next();
  };
}

function resGetLocalUser(req: Request): any {
  // express stores locals on res, but req might have res attached in express or express handlers access res.locals
  // In Express, res is passed separately
  return (req as any).res?.locals?.user || (req as any).user;
}

// Auth Rate Limiter (key on IP + account payload if available)
export const authRateLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  maxHits: env.AUTH_RATE_LIMIT_MAX,
  rateLimitType: "auth",
  keyGenerator: (req: Request) => {
    const email = req.body?.email || req.body?.username || "";
    return `${req.ip}:${email}`;
  },
});

// Chat Rate Limiter (key on userId or IP)
export const chatRateLimiter = createRateLimiterMiddleware({
  windowMs: 60 * 1000,
  maxHits: env.CHAT_RATE_LIMIT_MAX,
  rateLimitType: "chat",
  keyGenerator: (req: Request) => {
    const user = (req as any).res?.locals?.user;
    return user?._id || user?.id || req.ip || "anon";
  },
});

// Ingestion Rate Limiter (key on userId or IP)
export const ingestionRateLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  maxHits: env.INGESTION_RATE_LIMIT_MAX,
  rateLimitType: "ingestion",
  keyGenerator: (req: Request) => {
    const user = (req as any).res?.locals?.user;
    return user?._id || user?.id || req.ip || "anon";
  },
});
