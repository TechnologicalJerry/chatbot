"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultQuotaManager = exports.InMemoryQuotaManager = void 0;
const env_1 = require("../../config/env");
const securityLogger_1 = require("./securityLogger");
class InMemoryQuotaManager {
    store = new Map();
    getTodayKey() {
        return new Date().toISOString().split("T")[0];
    }
    getUserUsage(userId) {
        const today = this.getTodayKey();
        const existing = this.store.get(userId);
        if (!existing || existing.date !== today) {
            const newUsage = { date: today, tokens: 0, requests: 0 };
            this.store.set(userId, newUsage);
            return newUsage;
        }
        return existing;
    }
    async checkQuota(userId) {
        const usage = this.getUserUsage(userId);
        const maxTokens = env_1.env.AI_DAILY_TOKEN_LIMIT;
        const maxRequests = env_1.env.AI_DAILY_REQUEST_LIMIT;
        if (usage.tokens >= maxTokens) {
            (0, securityLogger_1.logSecurityEvent)({
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
            (0, securityLogger_1.logSecurityEvent)({
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
    async recordUsage(userId, inputTokens, outputTokens) {
        const usage = this.getUserUsage(userId);
        usage.tokens += inputTokens + outputTokens;
        usage.requests += 1;
    }
    async resetUserQuota(userId) {
        this.store.delete(userId);
    }
}
exports.InMemoryQuotaManager = InMemoryQuotaManager;
exports.defaultQuotaManager = new InMemoryQuotaManager();
