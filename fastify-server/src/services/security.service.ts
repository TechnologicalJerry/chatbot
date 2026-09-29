import { Redis } from 'ioredis';

const SUSPICIOUS_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all prior prompts/i,
  /system prompt override/i,
  /you are now Dan/i,
  /developer mode enabled/i,
  /jailbreak/i,
];

export class SecurityService {
  private memoryRateLimit = new Map<string, { count: number; resetAt: number }>();

  constructor(private redisClient: Redis | null = null) {}

  detectPromptInjection(text: string): { isSuspicious: boolean; matches: string[] } {
    const matches: string[] = [];
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        matches.push(pattern.source);
      }
    }
    return { isSuspicious: matches.length > 0, matches };
  }

  sanitizeInput(userContent: string): string {
    const sanitized = userContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<user_input>${sanitized}</user_input>`;
  }

  async checkRateLimit(key: string, limit = 60, windowSeconds = 60) {
    if (this.redisClient) {
      try {
        const redisKey = `ratelimit:${key}`;
        const count = await this.redisClient.incr(redisKey);
        if (count === 1) await this.redisClient.expire(redisKey, windowSeconds);
        const ttl = await this.redisClient.ttl(redisKey);
        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
          resetTime: Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000,
        };
      } catch {}
    }

    const now = Date.now();
    const entry = this.memoryRateLimit.get(key);
    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      this.memoryRateLimit.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetTime: resetAt };
    }

    entry.count += 1;
    return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetTime: entry.resetAt };
  }
}
