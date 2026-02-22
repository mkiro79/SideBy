import pino from "pino";

const validLevels = new Set([
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
]);

const rawLogLevel = (process.env.LOG_LEVEL || "info").toLowerCase().trim();
const normalizedLogLevel = rawLogLevel === "warning" ? "warn" : rawLogLevel;
const level = validLevels.has(normalizedLogLevel) ? normalizedLogLevel : "info";

const logger = pino({
  level,
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export default logger;
