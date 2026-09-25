"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamConcurrencyLimiter = void 0;
var env_1 = require("../config/env");
var securityLogger_1 = require("../infrastructure/security/securityLogger");
var constants_1 = require("../config/constants");
var activeStreamsPerUser = new Map();
function streamConcurrencyLimiter(req, res, next) {
    var user = res.locals.user;
    var userId = (user === null || user === void 0 ? void 0 : user._id) || (user === null || user === void 0 ? void 0 : user.id) || req.ip || "anon";
    var currentActive = activeStreamsPerUser.get(userId) || 0;
    if (currentActive >= env_1.env.STREAM_MAX_CONCURRENT) {
        var requestId = (req.headers[constants_1.HEADER_REQUEST_ID] || res.getHeader(constants_1.HEADER_REQUEST_ID) || "unknown");
        (0, securityLogger_1.logSecurityEvent)({
            eventType: "RATE_LIMIT_EXCEEDED",
            requestId: requestId,
            userId: userId,
            ip: req.ip,
            endpoint: req.originalUrl,
            details: { type: "stream_concurrency", active: currentActive, max: env_1.env.STREAM_MAX_CONCURRENT },
        });
        return res.status(429).json({
            success: false,
            error: {
                code: "STREAM_CONCURRENCY_EXCEEDED",
                message: "Maximum concurrent streaming connections (".concat(env_1.env.STREAM_MAX_CONCURRENT, ") reached. Please wait for an existing stream to complete."),
            },
            requestId: requestId,
        });
    }
    // Increment active stream count
    activeStreamsPerUser.set(userId, currentActive + 1);
    // Auto decrement on stream close / end / error
    var cleanedUp = false;
    var cleanup = function () {
        if (!cleanedUp) {
            cleanedUp = true;
            var count = activeStreamsPerUser.get(userId) || 1;
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
    var timeoutId = setTimeout(function () {
        if (!res.writableEnded) {
            (0, securityLogger_1.logSecurityEvent)({
                eventType: "RATE_LIMIT_EXCEEDED",
                userId: userId,
                ip: req.ip,
                endpoint: req.originalUrl,
                details: { type: "stream_timeout", maxDurationMs: env_1.env.STREAM_MAX_DURATION_MS },
            });
            res.write("data: ".concat(JSON.stringify({ error: "Stream maximum duration exceeded." }), "\n\n"));
            res.end();
            cleanup();
        }
    }, env_1.env.STREAM_MAX_DURATION_MS);
    res.on("close", function () { return clearTimeout(timeoutId); });
    res.on("finish", function () { return clearTimeout(timeoutId); });
    return next();
}
exports.streamConcurrencyLimiter = streamConcurrencyLimiter;
