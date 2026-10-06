import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import requestIdMiddleware from "./middleware/request-context/requestId";
import deserializeUser from "./middleware/auth/deserializeUser";
import configureRoutes from "./routes/index";
import AppError from "./errors/appError";
import logger from "./infrastructure/logger/logger";
import { HEADER_REQUEST_ID } from "./config/constants";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(requestIdMiddleware);
  app.use(deserializeUser);

  configureRoutes(app);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).id || req.headers[HEADER_REQUEST_ID];
    const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
    const message = err.message || "Internal server error";

    if (statusCode >= 500) {
      logger.error({ err, requestId }, "Unhandled application error");
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(err.details ? { details: err.details } : {}),
      },
      requestId,
    });
  });

  return app;
}

export default createApp;
