import { IRateLimiter, RateLimitResult, InMemoryRateLimiter } from "./rateLimiter";
import { redisManager } from "../redis/redis.client";
import logger from "../logger/logger";

export class RedisRateLimiter implements IRateLimiter {
  private fallbackLimiter = new InMemoryRateLimiter();

  async consume(key: string, windowMs: number, maxHits: number): Promise<RateLimitResult> {
    const isHealthy = await redisManager.isHealthy();
    if (!isHealthy) {
      return this.fallbackLimiter.consume(key, windowMs, maxHits);
    }

    try {
      const client = redisManager.getClient();
      const redisKey = `ratelimit:${key}`;
      const ttlSeconds = Math.ceil(windowMs / 1000);

      const hits = await client.incr(redisKey);
      if (hits === 1) {
        await client.expire(redisKey, ttlSeconds);
      }

      const pttl = await client.pttl(redisKey);
      const resetTimeMs = Date.now() + (pttl > 0 ? pttl : windowMs);

      const allowed = hits <= maxHits;
      const remainingHits = Math.max(0, maxHits - hits);

      return {
        allowed,
        currentHits: hits,
        maxHits,
        remainingHits,
        resetTimeMs,
      };
    } catch (err: any) {
      logger.warn({ err: err.message, key }, "Redis rate limit failed, falling back to in-memory");
      return this.fallbackLimiter.consume(key, windowMs, maxHits);
    }
  }

  async check(key: string, windowMs: number, maxHits: number): Promise<RateLimitResult> {
    const isHealthy = await redisManager.isHealthy();
    if (!isHealthy) {
      return this.fallbackLimiter.check(key, windowMs, maxHits);
    }

    try {
      const client = redisManager.getClient();
      const redisKey = `ratelimit:${key}`;

      const raw = await client.get(redisKey);
      const hits = raw ? parseInt(raw, 10) : 0;
      const pttl = await client.pttl(redisKey);

      const resetTimeMs = Date.now() + (pttl > 0 ? pttl : windowMs);
      const allowed = hits < maxHits;

      return {
        allowed,
        currentHits: hits,
        maxHits,
        remainingHits: Math.max(0, maxHits - hits),
        resetTimeMs,
      };
    } catch (err: any) {
      logger.warn({ err: err.message, key }, "Redis rate limit check failed");
      return this.fallbackLimiter.check(key, windowMs, maxHits);
    }
  }

  async reset(key: string): Promise<void> {
    const isHealthy = await redisManager.isHealthy();
    if (isHealthy) {
      try {
        await redisManager.getClient().del(`ratelimit:${key}`);
      } catch {
        // ignore
      }
    }
    await this.fallbackLimiter.reset(key);
  }
}

export const distributedRateLimiter: IRateLimiter = new RedisRateLimiter();
