import { env } from "../../config/env";
import { logSecurityEvent } from "./securityLogger";

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: "DAILY_TOKEN_QUOTA_EXCEEDED" | "DAILY_REQUEST_QUOTA_EXCEEDED";
  currentTokens: number;
  maxTokens: number;
  currentRequests: number;
  maxRequests: number;
}

export interface IQuotaManager {
  checkQuota(userId: string): Promise<QuotaCheckResult>;
  recordUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void>;
  resetUserQuota(userId: string): Promise<void>;
}

interface UserDailyUsage {
  date: string; // YYYY-MM-DD
  tokens: number;
  requests: number;
}

export class InMemoryQuotaManager implements IQuotaManager {
  private store: Map<string, UserDailyUsage> = new Map();

  private getTodayKey(): string {
    return new Date().toISOString().split("T")[0];
  }

  private getUserUsage(userId: string): UserDailyUsage {
    const today = this.getTodayKey();
    const existing = this.store.get(userId);

    if (!existing || existing.date !== today) {
      const newUsage: UserDailyUsage = { date: today, tokens: 0, requests: 0 };
      this.store.set(userId, newUsage);
      return newUsage;
    }

    return existing;
  }

  async checkQuota(userId: string): Promise<QuotaCheckResult> {
    const usage = this.getUserUsage(userId);

    const maxTokens = env.AI_DAILY_TOKEN_LIMIT;
    const maxRequests = env.AI_DAILY_REQUEST_LIMIT;

    if (usage.tokens >= maxTokens) {
      logSecurityEvent({
        eventType: "QUOTA_EXCEEDED",
        userId,
        details: { type: "daily_tokens", current: usage.tokens, max: maxTokens },
      });
      return {
        allowed: false,
        reason: "DAILY_TOKEN_QUOTA_EXCEEDED",
        currentTokens: usage.tokens,
        maxTokens,
        currentRequests: usage.requests,
        maxRequests,
      };
    }

    if (usage.requests >= maxRequests) {
      logSecurityEvent({
        eventType: "QUOTA_EXCEEDED",
        userId,
        details: { type: "daily_requests", current: usage.requests, max: maxRequests },
      });
      return {
        allowed: false,
        reason: "DAILY_REQUEST_QUOTA_EXCEEDED",
        currentTokens: usage.tokens,
        maxTokens,
        currentRequests: usage.requests,
        maxRequests,
      };
    }

    return {
      allowed: true,
      currentTokens: usage.tokens,
      maxTokens,
      currentRequests: usage.requests,
      maxRequests,
    };
  }

  async recordUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
    const usage = this.getUserUsage(userId);
    usage.tokens += inputTokens + outputTokens;
    usage.requests += 1;
  }

  async resetUserQuota(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

export const defaultQuotaManager: IQuotaManager = new InMemoryQuotaManager();
