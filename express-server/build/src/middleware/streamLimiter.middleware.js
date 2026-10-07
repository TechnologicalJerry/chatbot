"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamConcurrencyLimiter = void 0;
const env_1 = require("../config/env");
const securityLogger_1 = require("../infrastructure/security/securityLogger");
const constants_1 = require("../config/constants");
const activeStreamsPerUser = new Map();
function streamConcurrencyLimiter(req, res, next) {
    const user = res.locals.user;
    const userId = user?._id || user?.id || req.ip || "anon";
    const currentActive = activeStreamsPerUser.get(userId) || 0;
    if (currentActive >= env_1.env.STREAM_MAX_CONCURRENT) {
        const requestId = (req.headers[constants_1.HEADER_REQUEST_ID] || res.getHeader(constants_1.HEADER_REQUEST_ID) || "unknown");
        (0, securityLogger_1.logSecurityEvent)({
            eventType: "RATE_LIMIT_EXCEEDED",
            requestId,
            userId,
            ip: req.ip,
            endpoint: req.originalUrl,
            details: { type: "stream_concurrency", active: currentActive, max: env_1.env.STREAM_MAX_CONCURRENT },
        });
        return res.status(429).json({
            success: false,
            error: {
                code: "STREAM_CONCURRENCY_EXCEEDED",
                message: `Maximum concurrent streaming connections (${env_1.env.STREAM_MAX_CONCURRENT}) reached. Please wait for an existing stream to complete.`,
            },
            requestId,
        });
    }
    // Increment active stream count
    activeStreamsPerUser.set(userId, currentActive + 1);
    // Auto decrement on stream close / end / error
    let cleanedUp = false;
    const cleanup = () => {
        if (!cleanedUp) {
            cleanedUp = true;
            const count = activeStreamsPerUser.get(userId) || 1;
            if (count <= 1) {
                activeStreamsPerUser.delete(userId);
            }
            else {
                activeStreamsPerUser.set(userId, count - 1);
            }
        }
    };
    res.on("close", cleanup);
    res.on("finish", cleanup);
    res.on("error", cleanup);
    // Maximum stream duration safeguard
    const timeoutId = setTimeout(() => {
        if (!res.writableEnded) {
            (0, securityLogger_1.logSecurityEvent)({
                eventType: "RATE_LIMIT_EXCEEDED",
                userId,
                ip: req.ip,
                endpoint: req.originalUrl,
                details: { type: "stream_timeout", maxDurationMs: env_1.env.STREAM_MAX_DURATION_MS },
            });
            res.write(`data: ${JSON.stringify({ error: "Stream maximum duration exceeded." })}\n\n`);
            res.end();
            cleanup();
        }
    }, env_1.env.STREAM_MAX_DURATION_MS);
    res.on("close", () => clearTimeout(timeoutId));
    res.on("finish", () => clearTimeout(timeoutId));
    return next();
}
exports.streamConcurrencyLimiter = streamConcurrencyLimiter;
