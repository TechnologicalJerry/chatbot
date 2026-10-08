"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = __importDefault(require("../../config/env"));
const logger_1 = __importDefault(require("../logger/logger"));
async function connectDatabase() {
    try {
        const conn = await mongoose_1.default.connect(env_1.default.DB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        logger_1.default.info(`MongoDB connected: ${conn.connection.host || "success"}`);
        return conn;
    }
    catch (error) {
        logger_1.default.error({ error }, "Could not connect to MongoDB");
        if (process.env.NODE_ENV !== "test") {
            process.exit(1);
        }
        throw error;
    }
}
exports.connectDatabase = connectDatabase;
async function disconnectDatabase() {
    try {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
            logger_1.default.info("MongoDB disconnected gracefully");
        }
    }
    catch (error) {
        logger_1.default.error({ error }, "Error during MongoDB disconnection");
    }
}
exports.disconnectDatabase = disconnectDatabase;
exports.default = connectDatabase;
