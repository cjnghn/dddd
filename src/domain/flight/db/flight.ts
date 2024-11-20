// src/domain/flight/db/flight.ts
import type { PrismaClient } from "@prisma/client";

export function createFlight(
  prisma: PrismaClient,
  data: {
    name: string;
    date: Date;
    description?: string;
    logPath?: string;
  }
) {
  return prisma.flight.create({
    data: {
      name: data.name,
      date: data.date,
      description: data.description ?? "",
      flightLog: data.logPath ?? "",
    },
  });
}
