import { redisManager } from "../redis/redis.client";
import { env } from "../../config/env";
import logger from "../logger/logger";

export class CacheService {
  private static formatUserKey(userId: string, key: string): string {
    return `cache:user:${userId}:${key}`;
  }

  public static async get<T>(userId: string, key: string): Promise<T | null> {
    try {
      const isHealthy = await redisManager.isHealthy();
      if (!isHealthy) return null;

      const redisKey = CacheService.formatUserKey(userId, key);
      const raw = await redisManager.getClient().get(redisKey);
      if (!raw) return null;

      return JSON.parse(raw) as T;
    } catch (err: any) {
      logger.warn({ err: err.message, userId, key }, "Cache GET failed");
      return null;
    }
  }

  public static async set<T>(
    userId: string,
    key: string,
    value: T,
    ttlSeconds = env.CACHE_DEFAULT_TTL
  ): Promise<boolean> {
    try {
      const isHealthy = await redisManager.isHealthy();
      if (!isHealthy) return false;

      const redisKey = CacheService.formatUserKey(userId, key);
      const raw = JSON.stringify(value);
      await redisManager.getClient().set(redisKey, raw, "EX", ttlSeconds);
      return true;
    } catch (err: any) {
      logger.warn({ err: err.message, userId, key }, "Cache SET failed");
      return false;
    }
  }

  public static async delete(userId: string, key: string): Promise<boolean> {
    try {
      const isHealthy = await redisManager.isHealthy();
      if (!isHealthy) return false;

      const redisKey = CacheService.formatUserKey(userId, key);
      await redisManager.getClient().del(redisKey);
      return true;
    } catch (err: any) {
      logger.warn({ err: err.message, userId, key }, "Cache DELETE failed");
      return false;
    }
  }

  public static async getOrSet<T>(
    userId: string,
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = env.CACHE_DEFAULT_TTL
  ): Promise<T> {
    const cached = await CacheService.get<T>(userId, key);
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

export default CacheService;
