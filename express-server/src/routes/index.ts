import { Express } from "express";
import v1Router from "./v1";
import userRoutes from "../modules/users/user.routes";
import authRoutes from "../modules/auth/auth.routes";
import productRoutes from "../modules/products/product.routes";
import healthRoutes from "./health.routes";

export function configureRoutes(app: Express) {
  // Health & Liveness probes
  app.use("/", healthRoutes);
  app.use("/health", healthRoutes);

  // Versioned v1 API routes
  app.use("/api/v1", v1Router);

  // Legacy direct endpoints for 100% backward compatibility
  app.use("/api/users", userRoutes);
  app.use("/api/sessions", authRoutes);
  app.use("/api/products", productRoutes);
}

export default configureRoutes;
