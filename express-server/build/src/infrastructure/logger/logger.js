"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var pino_1 = __importDefault(require("pino"));
var dayjs_1 = __importDefault(require("dayjs"));
var isProduction = process.env.NODE_ENV === "production";
var logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || "info",
    base: {
        pid: false,
    },
    timestamp: function () { return ",\"time\":\"".concat((0, dayjs_1.default)().format(), "\""); },
    transport: !isProduction
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                ignore: "pid,hostname",
            },
        }
        : undefined,
});
exports.default = logger;
