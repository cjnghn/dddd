// src/infrastructure/database/prisma.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "../../config/logger";

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
    logger.error("Prisma Error:", e);
  });

  prisma.$on("warn", (e) => {
    logger.warn("Prisma Warning:", e);
  });

  prisma.$on("info", (e) => {
    logger.info("Prisma Info:", e);
  });

  prisma.$on("query", (e) => {
    logger.debug("Prisma Query:", {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  });

  return prisma;
}
