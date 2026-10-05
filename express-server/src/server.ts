import createApp from "./app";
import env from "./config/env";
import { connectDatabase, disconnectDatabase } from "./infrastructure/database/database";
import { startMetricsServer, stopMetricsServer } from "./infrastructure/metrics/metrics";
import logger from "./infrastructure/logger/logger";
import { Server } from "http";

export let httpServer: Server | null = null;

export async function bootstrap() {
  logger.info(`Starting Conversational AI Express Server [env=${env.NODE_ENV}]...`);

  // Connect to database
  await connectDatabase();

  // Start Prometheus metrics server
  startMetricsServer();

  const app = createApp();

  // Start HTTP server
  httpServer = app.listen(env.PORT, () => {
    logger.info(`Application Server is running at http://localhost:${env.PORT}`);
  });

  // Handle graceful shutdown signals
  setupGracefulShutdown();

  return httpServer;
}

function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} signal. Initiating graceful shutdown...`);
    if (httpServer) {
      httpServer.close(async () => {
        logger.info("HTTP server closed.");
        await stopMetricsServer();
        await disconnectDatabase();
        logger.info("Graceful shutdown completed.");
        process.exit(0);
      });

      // Force exit if shutdown hangs longer than 10 seconds
      setTimeout(() => {
        logger.error("Forceful shutdown triggered after timeout.");
        process.exit(1);
      }, 10000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (process.env.NODE_ENV !== "test") {
  bootstrap().catch((err) => {
    logger.error({ err }, "Fatal error during server bootstrap");
    process.exit(1);
  });
}
