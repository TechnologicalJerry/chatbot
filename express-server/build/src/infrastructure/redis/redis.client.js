"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = exports.redisManager = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("../logger/logger"));
class RedisClientManager {
    static instance;
    redisClient = null;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!RedisClientManager.instance) {
            RedisClientManager.instance = new RedisClientManager();
        }
        return RedisClientManager.instance;
    }
    getClient() {
        if (!this.redisClient) {
            this.redisClient = new ioredis_1.default(env_1.env.REDIS_URL, {
                connectTimeout: env_1.env.REDIS_CONNECT_TIMEOUT,
                maxRetriesPerRequest: null,
                enableReadyCheck: true,
                lazyConnect: true,
                retryStrategy(times) {
                    const delay = Math.min(times * 100, 3000);
                    return delay;
                },
            });
            this.redisClient.on("connect", () => {
                this.isConnected = true;
                logger_1.default.info("Redis client connected successfully");
            });
            this.redisClient.on("error", (err) => {
                this.isConnected = false;
                logger_1.default.error({ err: err.message }, "Redis connection error");
            });
            this.redisClient.on("close", () => {
                this.isConnected = false;
                logger_1.default.info("Redis connection closed");
            });
        }
        return this.redisClient;
    }
    async connect() {
        try {
            const client = this.getClient();
            if (client.status === "ready" || client.status === "connecting") {
                return true;
            }
            await client.connect();
            this.isConnected = true;
            return true;
        }
        catch (err) {
            this.isConnected = false;
            logger_1.default.warn({ err: err.message }, "Redis server unavailable");
            return false;
        }
    }
    async isHealthy() {
        try {
            if (!this.redisClient || this.redisClient.status !== "ready") {
                return false;
            }
            const res = await this.redisClient.ping();
            return res === "PONG";
        }
        catch {
            return false;
        }
    }
    async disconnect() {
        if (this.redisClient) {
            try {
                await this.redisClient.quit();
                logger_1.default.info("Redis disconnected gracefully");
            }
            catch {
                this.redisClient.disconnect();
            }
            finally {
                this.redisClient = null;
                this.isConnected = false;
            }
        }
    }
}
exports.redisManager = RedisClientManager.getInstance();
function getRedisClient() {
    return exports.redisManager.getClient();
}
exports.getRedisClient = getRedisClient;
