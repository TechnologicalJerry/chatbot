import Redis from "ioredis";
import { env } from "../../config/env";
import logger from "../logger/logger";

class RedisClientManager {
  private static instance: RedisClientManager;
  private redisClient: Redis | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): RedisClientManager {
    if (!RedisClientManager.instance) {
      RedisClientManager.instance = new RedisClientManager();
    }
    return RedisClientManager.instance;
  }

  public getClient(): Redis {
    if (!this.redisClient) {
      this.redisClient = new Redis(env.REDIS_URL, {
        connectTimeout: env.REDIS_CONNECT_TIMEOUT,
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy(times) {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
      });

      this.redisClient.on("connect", () => {
        this.isConnected = true;
        logger.info("Redis client connected successfully");
      });

      this.redisClient.on("error", (err) => {
        this.isConnected = false;
        logger.error({ err: err.message }, "Redis connection error");
      });

      this.redisClient.on("close", () => {
        this.isConnected = false;
        logger.info("Redis connection closed");
      });
    }

    return this.redisClient;
  }

  public async connect(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (client.status === "ready" || client.status === "connecting") {
        return true;
      }
      await client.connect();
      this.isConnected = true;
      return true;
    } catch (err: any) {
      this.isConnected = false;
      logger.warn({ err: err.message }, "Redis server unavailable");
      return false;
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      if (!this.redisClient || this.redisClient.status !== "ready") {
        return false;
      }
      const res = await this.redisClient.ping();
      return res === "PONG";
    } catch {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        logger.info("Redis disconnected gracefully");
      } catch {
        this.redisClient.disconnect();
      } finally {
        this.redisClient = null;
        this.isConnected = false;
      }
    }
  }
}

export const redisManager = RedisClientManager.getInstance();
export function getRedisClient(): Redis {
  return redisManager.getClient();
}
