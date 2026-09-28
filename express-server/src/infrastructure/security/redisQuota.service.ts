import { IQuotaManager, QuotaCheckResult, InMemoryQuotaManager } from "./quota.service";
import { redisManager } from "../redis/redis.client";
import { env } from "../../config/env";
import { logSecurityEvent } from "./securityLogger";
import logger from "../logger/logger";

export class RedisQuotaService implements IQuotaManager {
  private fallbackManager = new InMemoryQuotaManager();

  private getTodayKey(): string {
    return new Date().toISOString().split("T")[0];
  }

  async checkQuota(userId: string): Promise<QuotaCheckResult> {
    const isHealthy = await redisManager.isHealthy();
    if (!isHealthy) {
      return this.fallbackManager.checkQuota(userId);
    }

    try {
      const client = redisManager.getClient();
      const today = this.getTodayKey();
      const tokenKey = `quota:tokens:${userId}:${today}`;
      const requestKey = `quota:requests:${userId}:${today}`;

      const [tokenRaw, requestRaw] = await Promise.all([client.get(tokenKey), client.get(requestKey)]);

      const currentTokens = tokenRaw ? parseInt(tokenRaw, 10) : 0;
      const currentRequests = requestRaw ? parseInt(requestRaw, 10) : 0;

      const maxTokens = env.AI_DAILY_TOKEN_LIMIT;
      const maxRequests = env.AI_DAILY_REQUEST_LIMIT;

      if (currentTokens >= maxTokens) {
        logSecurityEvent({
          eventType: "QUOTA_EXCEEDED",
          userId,
          details: { type: "daily_tokens", current: currentTokens, max: maxTokens },
        });
        return {
          allowed: false,
          reason: "DAILY_TOKEN_QUOTA_EXCEEDED",
          currentTokens,
          maxTokens,
          currentRequests,
          maxRequests,
        };
      }

      if (currentRequests >= maxRequests) {
        logSecurityEvent({
          eventType: "QUOTA_EXCEEDED",
          userId,
          details: { type: "daily_requests", current: currentRequests, max: maxRequests },
        });
        return {
          allowed: false,
          reason: "DAILY_REQUEST_QUOTA_EXCEEDED",
          currentTokens,
          maxTokens,
          currentRequests,
          maxRequests,
        };
      }

      return {
        allowed: true,
        currentTokens,
        maxTokens,
        currentRequests,
        maxRequests,
      };
    } catch (err: any) {
      logger.warn({ err: err.message, userId }, "Redis quota check failed, falling back to in-memory");
      return this.fallbackManager.checkQuota(userId);
    }
  }

  async recordUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
    const isHealthy = await redisManager.isHealthy();
    if (!isHealthy) {
      return this.fallbackManager.recordUsage(userId, inputTokens, outputTokens);
    }

    try {
      const client = redisManager.getClient();
      const today = this.getTodayKey();
      const tokenKey = `quota:tokens:${userId}:${today}`;
      const requestKey = `quota:requests:${userId}:${today}`;

      const totalTokens = inputTokens + outputTokens;

      const [newTokens, newRequests] = await Promise.all([
        client.incrby(tokenKey, totalTokens),
        client.incr(requestKey),
      ]);

      if (newTokens === totalTokens) {
        await client.expire(tokenKey, 86400 * 2); // 2 days TTL
      }
      if (newRequests === 1) {
        await client.expire(requestKey, 86400 * 2);
      }
    } catch (err: any) {
      logger.warn({ err: err.message, userId }, "Redis record quota usage failed");
      await this.fallbackManager.recordUsage(userId, inputTokens, outputTokens);
    }
  }

  async resetUserQuota(userId: string): Promise<void> {
    const isHealthy = await redisManager.isHealthy();
    if (isHealthy) {
      try {
        const today = this.getTodayKey();
        await redisManager.getClient().del(`quota:tokens:${userId}:${today}`, `quota:requests:${userId}:${today}`);
      } catch {
        // ignore
      }
    }
    await this.fallbackManager.resetUserQuota(userId);
  }
}

export const distributedQuotaManager: IQuotaManager = new RedisQuotaService();
