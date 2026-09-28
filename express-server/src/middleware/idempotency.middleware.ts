import { Request, Response, NextFunction } from "express";
import { redisManager } from "../infrastructure/redis/redis.client";
import { env } from "../config/env";
import logger from "../infrastructure/logger/logger";
import { HEADER_REQUEST_ID } from "../config/constants";

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  // If no idempotency key provided, bypass
  if (!idempotencyKey || !idempotencyKey.trim()) {
    return next();
  }

  const isHealthy = await redisManager.isHealthy();
  if (!isHealthy) {
    return next(); // Fail open if Redis is down
  }

  const user = res.locals.user;
  const userId = user?._id || user?.id || "anon";
  const redisKey = `idempotency:${userId}:${idempotencyKey.trim()}`;
  const client = redisManager.getClient();

  try {
    const existing = await client.get(redisKey);
    if (existing) {
      if (existing === "IN_PROGRESS") {
        const requestId = (req.headers[HEADER_REQUEST_ID] || res.getHeader(HEADER_REQUEST_ID) || "unknown") as string;
        return res.status(409).json({
          success: false,
          error: {
            code: "DUPLICATE_IN_PROGRESS",
            message: "A request with this Idempotency-Key is currently processing.",
          },
          requestId,
        });
      }

      const cached = JSON.parse(existing);
      res.setHeader("X-Cache-Lookup", "HIT-IDEMPOTENT");
      return res.status(cached.status).json(cached.body);
    }

    // Set lock value IN_PROGRESS for 60 seconds while handling
    await client.set(redisKey, "IN_PROGRESS", "EX", 60);

    // Override res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const cachePayload = JSON.stringify({
          status: res.statusCode,
          body,
        });
        client.set(redisKey, cachePayload, "EX", env.IDEMPOTENCY_TTL_SECONDS).catch((err) => {
          logger.warn({ err: err.message }, "Failed to cache idempotent response");
        });
      } else {
        client.del(redisKey).catch(() => {});
      }
      return originalJson(body);
    };

    return next();
  } catch (err: any) {
    logger.warn({ err: err.message }, "Idempotency check error");
    return next();
  }
}
