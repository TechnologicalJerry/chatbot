"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestionRateLimiter = exports.chatRateLimiter = exports.authRateLimiter = exports.createRateLimiterMiddleware = void 0;
const rateLimiter_1 = require("../infrastructure/security/rateLimiter");
const securityLogger_1 = require("../infrastructure/security/securityLogger");
const env_1 = require("../config/env");
const constants_1 = require("../config/constants");
function createRateLimiterMiddleware(options) {
    const { windowMs, maxHits, rateLimitType, keyGenerator = (req) => {
        const user = resGetLocalUser(req);
        return user?._id || req.ip || "unknown";
    }, rateLimiter = rateLimiter_1.defaultRateLimiter, } = options;
    return async (req, res, next) => {
        if (!env_1.env.RATE_LIMIT_ENABLED) {
            return next();
        }
        const key = `${rateLimitType}:${keyGenerator(req)}`;
        const result = await rateLimiter.consume(key, windowMs, maxHits);
        res.setHeader("X-RateLimit-Limit", result.maxHits);
        res.setHeader("X-RateLimit-Remaining", result.remainingHits);
        res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTimeMs / 1000));
        if (!result.allowed) {
            const requestId = (req.headers[constants_1.HEADER_REQUEST_ID] || res.getHeader(constants_1.HEADER_REQUEST_ID) || "unknown");
            const userId = resGetLocalUser(req)?._id;
            (0, securityLogger_1.logSecurityEvent)({
                eventType: "RATE_LIMIT_EXCEEDED",
                requestId,
                userId,
                ip: req.ip,
                endpoint: req.originalUrl,
                details: { type: rateLimitType, currentHits: result.currentHits, maxHits: result.maxHits },
            });
            return res.status(429).json({
                success: false,
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                    message: `Too many requests for ${rateLimitType}. Please try again later.`,
                },
                requestId,
            });
        }
        return next();
    };
}
exports.createRateLimiterMiddleware = createRateLimiterMiddleware;
function resGetLocalUser(req) {
    // express stores locals on res, but req might have res attached in express or express handlers access res.locals
    // In Express, res is passed separately
    return req.res?.locals?.user || req.user;
}
// Auth Rate Limiter (key on IP + account payload if available)
exports.authRateLimiter = createRateLimiterMiddleware({
    windowMs: 15 * 60 * 1000,
    maxHits: env_1.env.AUTH_RATE_LIMIT_MAX,
    rateLimitType: "auth",
    keyGenerator: (req) => {
        const email = req.body?.email || req.body?.username || "";
        return `${req.ip}:${email}`;
    },
});
// Chat Rate Limiter (key on userId or IP)
exports.chatRateLimiter = createRateLimiterMiddleware({
    windowMs: 60 * 1000,
    maxHits: env_1.env.CHAT_RATE_LIMIT_MAX,
    rateLimitType: "chat",
    keyGenerator: (req) => {
        const user = req.res?.locals?.user;
        return user?._id || user?.id || req.ip || "anon";
    },
});
// Ingestion Rate Limiter (key on userId or IP)
exports.ingestionRateLimiter = createRateLimiterMiddleware({
    windowMs: 15 * 60 * 1000,
    maxHits: env_1.env.INGESTION_RATE_LIMIT_MAX,
    rateLimitType: "ingestion",
    keyGenerator: (req) => {
        const user = req.res?.locals?.user;
        return user?._id || user?.id || req.ip || "anon";
    },
});
