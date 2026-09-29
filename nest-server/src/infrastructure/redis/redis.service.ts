import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('redisUrl') || 'redis://127.0.0.1:6379';
    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis client connected');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection warning/error: ${err.message}`);
      });

      this.client.connect().catch((err) => {
        this.logger.warn(`Initial Redis connection failed: ${err.message}. Falling back to memory.`);
      });
    } catch (err: any) {
      this.logger.warn(`Redis initialization error: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.warn(`Redis set error for ${key}: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {}
  }

  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) return 1;
    try {
      return await this.client.incr(key);
    } catch {
      return 1;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.expire(key, seconds);
    } catch {}
  }
}
