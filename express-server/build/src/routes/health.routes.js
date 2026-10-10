"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_client_1 = require("../infrastructure/redis/redis.client");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /healthcheck:
 *   get:
 *     tags:
 *     - Health
 *     summary: Legacy liveness health check
 *     responses:
 *       200:
 *         description: Process is running
 */
router.get("/healthcheck", (req, res) => {
    return res.status(200).send("OK");
});
/**
 * @openapi
 * /health/live:
 *   get:
 *     tags:
 *     - Health
 *     summary: Process liveness probe
 *     responses:
 *       200:
 *         description: Application process is alive
 */
router.get("/live", (req, res) => {
    return res.status(200).json({
        status: "live",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});
/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags:
 *     - Health
 *     summary: Instance readiness probe for traffic routing
 *     responses:
 *       200:
 *         description: Instance ready to process traffic
 *       503:
 *         description: Required dependency unavailable
 */
router.get("/ready", async (req, res) => {
    const isMongoConnected = mongoose_1.default.connection.readyState === 1;
    const isRedisHealthy = await redis_client_1.redisManager.isHealthy();
    const isReady = isMongoConnected; // Mongo is strictly required, Redis falls back gracefully if down in single node
    const body = {
        status: isReady ? "ready" : "unhealthy",
        dependencies: {
            mongodb: isMongoConnected ? "connected" : "disconnected",
            redis: isRedisHealthy ? "connected" : "unavailable",
        },
        timestamp: new Date().toISOString(),
    };
    if (!isReady) {
        return res.status(503).json(body);
    }
    return res.status(200).json(body);
});
exports.default = router;
