// src/domain/flight/analysis/parsers.ts
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { logger } from "../../../config/logger";
import type { FlightLogEntry, TrackingResult, VideoMetadata } from "../types";
import { flightLogRowSchema, trackingFileSchema } from "../validators";

export function parseFlightLog(content: string): FlightLogEntry[] {
  try {
    logger.debug("Parsing flight log");

    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const parsed = z.array(flightLogRowSchema).parse(rows);

    logger.debug("Flight log parsed successfully", {
      rowCount: parsed.length,
    });

    return parsed;
  } catch (error) {
    logger.error("Failed to parse flight log", { error });
    throw new Error(
      `Failed to parse flight log: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function parseTrackingData(content: string): {
  metadata: VideoMetadata;
  results: TrackingResult[];
} {
  try {
    logger.debug("Parsing tracking data");

    const data = trackingFileSchema.parse(JSON.parse(content));

    logger.debug("Tracking data parsed successfully", {
      videoName: data.video.name,
      resultCount: data.tracking_results.length,
    });

    return {
      metadata: data.video,
      results: data.tracking_results,
    };
  } catch (error) {
    logger.error("Failed to parse tracking data", { error });
    throw new Error(
      `Failed to parse tracking data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
