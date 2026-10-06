import mongoose from "mongoose";
import env from "../../config/env";
import logger from "../logger/logger";

export async function connectDatabase() {
  try {
    const conn = await mongoose.connect(env.DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host || "success"}`);
    return conn;
  } catch (error) {
    logger.error({ error }, "Could not connect to MongoDB");
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info("MongoDB disconnected gracefully");
    }
  } catch (error) {
    logger.error({ error }, "Error during MongoDB disconnection");
  }
}

export default connectDatabase;
