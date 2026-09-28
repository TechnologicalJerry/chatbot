export interface RateLimitResult {
  allowed: boolean;
  currentHits: number;
  maxHits: number;
  remainingHits: number;
  resetTimeMs: number;
}

export interface IRateLimiter {
  consume(key: string, windowMs: number, maxHits: number): Promise<RateLimitResult>;
  check(key: string, windowMs: number, maxHits: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

interface WindowRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter implements IRateLimiter {
  private store: Map<string, WindowRecord> = new Map();

  async consume(key: string, windowMs: number, maxHits: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out old timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxHits) {
      const oldestInWindow = record.timestamps[0];
      const resetTimeMs = oldestInWindow + windowMs;
      return {
        allowed: false,
        currentHits: record.timestamps.length,
        maxHits,
        remainingHits: 0,
        resetTimeMs,
      };
    }

    record.timestamps.push(now);
    const resetTimeMs = record.timestamps[0] + windowMs;

    return {
      allowed: true,
      currentHits: record.timestamps.length,
      maxHits,
      remainingHits: Math.max(0, maxHits - record.timestamps.length),
      resetTimeMs,
    };
  }

  async check(key: string, windowMs: number, maxHits: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const record = this.store.get(key);
    const validTimestamps = record ? record.timestamps.filter((ts) => ts > windowStart) : [];

    const allowed = validTimestamps.length < maxHits;
    const resetTimeMs = validTimestamps.length > 0 ? validTimestamps[0] + windowMs : now + windowMs;

    return {
      allowed,
      currentHits: validTimestamps.length,
      maxHits,
      remainingHits: Math.max(0, maxHits - validTimestamps.length),
      resetTimeMs,
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const defaultRateLimiter: IRateLimiter = new InMemoryRateLimiter();
