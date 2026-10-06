import pino from "pino";
import dayjs from "dayjs";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    pid: false,
  },
  timestamp: () => `,"time":"${dayjs().format()}"`,
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

export default logger;
