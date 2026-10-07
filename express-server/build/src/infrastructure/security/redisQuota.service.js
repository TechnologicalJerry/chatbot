"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributedQuotaManager = exports.RedisQuotaService = void 0;
const quota_service_1 = require("./quota.service");
const redis_client_1 = require("../redis/redis.client");
const env_1 = require("../../config/env");
const securityLogger_1 = require("./securityLogger");
const logger_1 = __importDefault(require("../logger/logger"));
class RedisQuotaService {
    fallbackManager = new quota_service_1.InMemoryQuotaManager();
    getTodayKey() {
        return new Date().toISOString().split("T")[0];
    }
    async checkQuota(userId) {
        const isHealthy = await redis_client_1.redisManager.isHealthy();
        if (!isHealthy) {
            return this.fallbackManager.checkQuota(userId);
        }
        try {
            const client = redis_client_1.redisManager.getClient();
            const today = this.getTodayKey();
            const tokenKey = `quota:tokens:${userId}:${today}`;
            const requestKey = `quota:requests:${userId}:${today}`;
            const [tokenRaw, requestRaw] = await Promise.all([client.get(tokenKey), client.get(requestKey)]);
            const currentTokens = tokenRaw ? parseInt(tokenRaw, 10) : 0;
            const currentRequests = requestRaw ? parseInt(requestRaw, 10) : 0;
            const maxTokens = env_1.env.AI_DAILY_TOKEN_LIMIT;
            const maxRequests = env_1.env.AI_DAILY_REQUEST_LIMIT;
            if (currentTokens >= maxTokens) {
                (0, securityLogger_1.logSecurityEvent)({
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
                (0, securityLogger_1.logSecurityEvent)({
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
        }
        catch (err) {
            logger_1.default.warn({ err: err.message, userId }, "Redis quota check failed, falling back to in-memory");
            return this.fallbackManager.checkQuota(userId);
        }
    }
    async recordUsage(userId, inputTokens, outputTokens) {
        const isHealthy = await redis_client_1.redisManager.isHealthy();
        if (!isHealthy) {
            return this.fallbackManager.recordUsage(userId, inputTokens, outputTokens);
        }
        try {
            const client = redis_client_1.redisManager.getClient();
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
        }
        catch (err) {
            logger_1.default.warn({ err: err.message, userId }, "Redis record quota usage failed");
            await this.fallbackManager.recordUsage(userId, inputTokens, outputTokens);
        }
    }
    async resetUserQuota(userId) {
        const isHealthy = await redis_client_1.redisManager.isHealthy();
        if (isHealthy) {
            try {
                const today = this.getTodayKey();
                await redis_client_1.redisManager.getClient().del(`quota:tokens:${userId}:${today}`, `quota:requests:${userId}:${today}`);
            }
            catch {
                // ignore
            }
        }
        await this.fallbackManager.resetUserQuota(userId);
    }
}
exports.RedisQuotaService = RedisQuotaService;
exports.distributedQuotaManager = new RedisQuotaService();
