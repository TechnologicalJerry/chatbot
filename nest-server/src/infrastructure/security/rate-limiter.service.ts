import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private memoryStore = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly redisService: RedisService) {}

  async checkRateLimit(
    key: string,
    limit: number = 60,
    windowSeconds: number = 60,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redisKey = `ratelimit:${key}`;
    const redis = this.redisService.getClient();

    if (redis) {
      try {
        const count = await redis.incr(redisKey);
        if (count === 1) {
          await redis.expire(redisKey, windowSeconds);
        }
        const ttl = await redis.ttl(redisKey);
        const resetTime = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000;
        const allowed = count <= limit;
        const remaining = Math.max(0, limit - count);

        return { allowed, remaining, resetTime };
      } catch (err: any) {
        this.logger.warn(`Redis rate limit failed: ${err.message}, falling back to memory`);
      }
    }

    // Memory fallback
    const now = Date.now();
    const entry = this.memoryStore.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      this.memoryStore.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetTime: resetAt };
    }

    entry.count += 1;
    const allowed = entry.count <= limit;
    const remaining = Math.max(0, limit - entry.count);
    return { allowed, remaining, resetTime: entry.resetAt };
  }
}
