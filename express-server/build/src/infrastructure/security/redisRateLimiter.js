"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributedRateLimiter = exports.RedisRateLimiter = void 0;
const rateLimiter_1 = require("./rateLimiter");
const redis_client_1 = require("../redis/redis.client");
const logger_1 = __importDefault(require("../logger/logger"));
class RedisRateLimiter {
    fallbackLimiter = new rateLimiter_1.InMemoryRateLimiter();
    async consume(key, windowMs, maxHits) {
        const isHealthy = await redis_client_1.redisManager.isHealthy();
        if (!isHealthy) {
            return this.fallbackLimiter.consume(key, windowMs, maxHits);
        }
        try {
            const client = redis_client_1.redisManager.getClient();
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
        }
        catch (err) {
            logger_1.default.warn({ err: err.message, key }, "Redis rate limit failed, falling back to in-memory");
            return this.fallbackLimiter.consume(key, windowMs, maxHits);
        }
    }
    async check(key, windowMs, maxHits) {
        const isHealthy = await redis_client_1.redisManager.isHealthy();
        if (!isHealthy) {
            return this.fallbackLimiter.check(key, windowMs, maxHits);
        }
        try {
            const client = redis_client_1.redisManager.getClient();
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
        }
        catch (err) {
            logger_1.default.warn({ err: err.message, key }, "Redis rate limit check failed");
            return this.fallbackLimiter.check(key, windowMs, maxHits);
        }
    }
    async reset(key) {
        const isHealthy = await redis_client_1.redisManager.isHealthy();
        if (isHealthy) {
            try {
                await redis_client_1.redisManager.getClient().del(`ratelimit:${key}`);
            }
            catch {
                // ignore
            }
        }
        await this.fallbackLimiter.reset(key);
    }
}
exports.RedisRateLimiter = RedisRateLimiter;
exports.distributedRateLimiter = new RedisRateLimiter();
