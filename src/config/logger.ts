// src/config/logger.ts
import winston, { createLogger, format, transports } from "winston";
import { env } from "./environment";

const { combine, timestamp, prettyPrint, colorize } = format;

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), prettyPrint(), colorize()),
  transports: [new transports.Console()],
});

if (env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
