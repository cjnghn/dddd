// src/domain/flight/repositories/telemetry.ts
import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";
import type { FlightLogEntry } from "../types";

export class TelemetryRepository {
  constructor(private prisma: PrismaClient) {}

  async createMany(flightId: number, entries: FlightLogEntry[]) {
    logger.debug("Creating telemetry entries", {
      flightId,
      entryCount: entries.length,
    });

    return this.prisma.telemetry.createMany({
      data: entries.map((entry) => ({
        flightId,
        timeFromStartMS: entry.timeFromStart,
        latitude: entry.latitude,
        longitude: entry.longitude,
        altitude: entry.altitude,
        heading: entry.heading,
        isVideo: entry.isVideo,
      })),
    });
  }

  async findByTimeRange(flightId: number, startTime: number, endTime: number) {
    return this.prisma.telemetry.findMany({
      where: {
        flightId,
        timeFromStartMS: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: {
        timeFromStartMS: "asc",
      },
    });
  }
}
