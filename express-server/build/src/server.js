"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = exports.httpServer = void 0;
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const database_1 = require("./infrastructure/database/database");
const metrics_1 = require("./infrastructure/metrics/metrics");
const logger_1 = __importDefault(require("./infrastructure/logger/logger"));
exports.httpServer = null;
async function bootstrap() {
    logger_1.default.info(`Starting Conversational AI Express Server [env=${env_1.default.NODE_ENV}]...`);
    // Connect to database
    await (0, database_1.connectDatabase)();
    // Start Prometheus metrics server
    (0, metrics_1.startMetricsServer)();
    const app = (0, app_1.default)();
    // Start HTTP server
    exports.httpServer = app.listen(env_1.default.PORT, () => {
        logger_1.default.info(`Application Server is running at http://localhost:${env_1.default.PORT}`);
    });
    // Handle graceful shutdown signals
    setupGracefulShutdown();
    return exports.httpServer;
}
exports.bootstrap = bootstrap;
function setupGracefulShutdown() {
    const shutdown = async (signal) => {
        logger_1.default.info(`Received ${signal} signal. Initiating graceful shutdown...`);
        if (exports.httpServer) {
            exports.httpServer.close(async () => {
                logger_1.default.info("HTTP server closed.");
                await (0, metrics_1.stopMetricsServer)();
                await (0, database_1.disconnectDatabase)();
                logger_1.default.info("Graceful shutdown completed.");
                process.exit(0);
            });
            // Force exit if shutdown hangs longer than 10 seconds
            setTimeout(() => {
                logger_1.default.error("Forceful shutdown triggered after timeout.");
                process.exit(1);
            }, 10000).unref();
        }
        else {
            process.exit(0);
        }
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}
if (process.env.NODE_ENV !== "test") {
    bootstrap().catch((err) => {
        logger_1.default.error({ err }, "Fatal error during server bootstrap");
        process.exit(1);
    });
}
