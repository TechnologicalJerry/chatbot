"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRateLimiter = exports.InMemoryRateLimiter = void 0;
class InMemoryRateLimiter {
    store = new Map();
    async consume(key, windowMs, maxHits) {
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
    async check(key, windowMs, maxHits) {
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
    async reset(key) {
        this.store.delete(key);
    }
}
exports.InMemoryRateLimiter = InMemoryRateLimiter;
exports.defaultRateLimiter = new InMemoryRateLimiter();
