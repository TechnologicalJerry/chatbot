"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_client_1 = require("../redis/redis.client");
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("../logger/logger"));
class CacheService {
    static formatUserKey(userId, key) {
        return `cache:user:${userId}:${key}`;
    }
    static async get(userId, key) {
        try {
            const isHealthy = await redis_client_1.redisManager.isHealthy();
            if (!isHealthy)
                return null;
            const redisKey = CacheService.formatUserKey(userId, key);
            const raw = await redis_client_1.redisManager.getClient().get(redisKey);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch (err) {
            logger_1.default.warn({ err: err.message, userId, key }, "Cache GET failed");
            return null;
        }
    }
    static async set(userId, key, value, ttlSeconds = env_1.env.CACHE_DEFAULT_TTL) {
        try {
            const isHealthy = await redis_client_1.redisManager.isHealthy();
            if (!isHealthy)
                return false;
            const redisKey = CacheService.formatUserKey(userId, key);
            const raw = JSON.stringify(value);
            await redis_client_1.redisManager.getClient().set(redisKey, raw, "EX", ttlSeconds);
            return true;
        }
        catch (err) {
            logger_1.default.warn({ err: err.message, userId, key }, "Cache SET failed");
            return false;
        }
    }
    static async delete(userId, key) {
        try {
            const isHealthy = await redis_client_1.redisManager.isHealthy();
            if (!isHealthy)
                return false;
            const redisKey = CacheService.formatUserKey(userId, key);
            await redis_client_1.redisManager.getClient().del(redisKey);
            return true;
        }
        catch (err) {
            logger_1.default.warn({ err: err.message, userId, key }, "Cache DELETE failed");
            return false;
        }
    }
    static async getOrSet(userId, key, fetcher, ttlSeconds = env_1.env.CACHE_DEFAULT_TTL) {
        const cached = await CacheService.get(userId, key);
        if (cached !== null) {
            return cached;
        }
        const fetched = await fetcher();
        if (fetched !== null && fetched !== undefined) {
            await CacheService.set(userId, key, fetched, ttlSeconds);
        }
        return fetched;
    }
}
exports.CacheService = CacheService;
exports.default = CacheService;
