import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface TierQuota {
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
}

const TIER_LIMITS: Record<string, TierQuota> = {
  free: { maxRequestsPerDay: 100, maxTokensPerDay: 50000 },
  pro: { maxRequestsPerDay: 5000, maxTokensPerDay: 2000000 },
  enterprise: { maxRequestsPerDay: 50000, maxTokensPerDay: 20000000 },
};

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(private readonly redisService: RedisService) {}

  private getTodayKey(userId: string, type: 'requests' | 'tokens'): string {
    const today = new Date().toISOString().split('T')[0];
    return `quota:${userId}:${today}:${type}`;
  }

  async checkQuota(
    userId: string,
    tier: string = 'free',
    estimatedTokens: number = 0,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const reqKey = this.getTodayKey(userId, 'requests');
    const tokenKey = this.getTodayKey(userId, 'tokens');

    const currentReqStr = await this.redisService.get(reqKey);
    const currentTokensStr = await this.redisService.get(tokenKey);

    const currentReqs = currentReqStr ? parseInt(currentReqStr, 10) : 0;
    const currentTokens = currentTokensStr ? parseInt(currentTokensStr, 10) : 0;

    if (currentReqs >= limits.maxRequestsPerDay) {
      return { allowed: false, reason: `Daily request quota (${limits.maxRequestsPerDay}) exceeded for ${tier} tier` };
    }

    if (currentTokens + estimatedTokens > limits.maxTokensPerDay) {
      return { allowed: false, reason: `Daily token quota (${limits.maxTokensPerDay}) exceeded for ${tier} tier` };
    }

    return { allowed: true };
  }

  async recordUsage(userId: string, tokens: number = 0): Promise<void> {
    const reqKey = this.getTodayKey(userId, 'requests');
    const tokenKey = this.getTodayKey(userId, 'tokens');
    const ttl = 86400; // 24 hours

    const reqCount = await this.redisService.incr(reqKey);
    if (reqCount === 1) await this.redisService.expire(reqKey, ttl);

    if (tokens > 0) {
      const redis = this.redisService.getClient();
      if (redis) {
        try {
          const tokenCount = await redis.incrby(tokenKey, tokens);
          if (tokenCount === tokens) await redis.expire(tokenKey, ttl);
        } catch {
          await this.redisService.set(tokenKey, tokens.toString(), ttl);
        }
      }
    }
  }
}
