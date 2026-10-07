"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = void 0;
const redis_client_1 = require("../infrastructure/redis/redis.client");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../infrastructure/logger/logger"));
const constants_1 = require("../config/constants");
async function idempotencyMiddleware(req, res, next) {
    const idempotencyKey = req.headers["idempotency-key"];
    // If no idempotency key provided, bypass
    if (!idempotencyKey || !idempotencyKey.trim()) {
        return next();
    }
    const isHealthy = await redis_client_1.redisManager.isHealthy();
    if (!isHealthy) {
        return next(); // Fail open if Redis is down
    }
    const user = res.locals.user;
    const userId = user?._id || user?.id || "anon";
    const redisKey = `idempotency:${userId}:${idempotencyKey.trim()}`;
    const client = redis_client_1.redisManager.getClient();
    try {
        const existing = await client.get(redisKey);
        if (existing) {
            if (existing === "IN_PROGRESS") {
                const requestId = (req.headers[constants_1.HEADER_REQUEST_ID] || res.getHeader(constants_1.HEADER_REQUEST_ID) || "unknown");
                return res.status(409).json({
                    success: false,
                    error: {
                        code: "DUPLICATE_IN_PROGRESS",
                        message: "A request with this Idempotency-Key is currently processing.",
                    },
                    requestId,
                });
            }
            const cached = JSON.parse(existing);
            res.setHeader("X-Cache-Lookup", "HIT-IDEMPOTENT");
            return res.status(cached.status).json(cached.body);
        }
        // Set lock value IN_PROGRESS for 60 seconds while handling
        await client.set(redisKey, "IN_PROGRESS", "EX", 60);
        // Override res.json to capture response
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const cachePayload = JSON.stringify({
                    status: res.statusCode,
                    body,
                });
                client.set(redisKey, cachePayload, "EX", env_1.env.IDEMPOTENCY_TTL_SECONDS).catch((err) => {
                    logger_1.default.warn({ err: err.message }, "Failed to cache idempotent response");
                });
            }
            else {
                client.del(redisKey).catch(() => { });
            }
            return originalJson(body);
        };
        return next();
    }
    catch (err) {
        logger_1.default.warn({ err: err.message }, "Idempotency check error");
        return next();
    }
}
exports.idempotencyMiddleware = idempotencyMiddleware;
