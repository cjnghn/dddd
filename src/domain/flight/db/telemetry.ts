import type { PrismaClient } from "@prisma/client";
import type { FlightLogEntry } from "../types";

export function createTelemetryEntries(
  prisma: PrismaClient,
  flightId: number,
  entries: FlightLogEntry[]
) {
  return prisma.telemetry.createMany({
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
