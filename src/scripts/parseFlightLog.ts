// src/scripts/parseFlightLog.ts
import fs from "node:fs";
import csv from "csv-parser";
import type { Prisma } from "@prisma/client";
import { TelemetrySchema } from "../schemas";
import { prisma } from "../lib/prisma";

const FEET_TO_METERS = 0.3048;

export const parseFlightLog = async (
  flightLogPath: string,
  flightId: number
): Promise<void> => {
  const rows: Prisma.TelemetryCreateManyInput[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(flightLogPath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          const validatedRow = TelemetrySchema.parse(row);
          rows.push({
            timeFromStartMS: validatedRow["time(millisecond)"],
            latitude: validatedRow.latitude,
            longitude: validatedRow.longitude,
            altitude: validatedRow["altitude(feet)"] * FEET_TO_METERS,
            heading: validatedRow["compass_heading(degrees)"],
            isVideo: validatedRow.isVideo,
            flightId,
          });
        } catch (error) {
          console.warn("Invalid row in flight log:", error);
        }
      })
      .on("end", async () => {
        try {
          await prisma.telemetry.createMany({ data: rows });
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject);
  });
};
