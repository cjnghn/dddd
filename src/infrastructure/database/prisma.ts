// src/infrastructure/database/prisma.ts
import { PrismaClient } from "@prisma/client";

import { logger } from "../logging/logger";

export function createPrismaClient() {
  const prisma = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });

  prisma.$on("error", (e) => {
    logger.error("Database Error:", e);
  });

  prisma.$on("warn", (e) => {
    logger.warn("Database Warning:", e);
  });

  prisma.$on("info", (e) => {
    logger.info("Database Info:", e);
  });

  prisma.$on("query", (e) => {
    logger.debug("Database Query:", {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  });

  return prisma;
}
