// src/domain/flight/services/processor.ts
import * as fs from "node:fs/promises";
import { logger } from "../../../config/logger";
import {
  findVideoSegments,
  parseFlightLog,
  parseTrackingData,
} from "../analysis";
import {
  FlightRepository,
  TelemetryRepository,
  VideoRepository,
  TrackingRepository,
} from "../repositories";
import type { PrismaClient } from "@prisma/client";
import type { Flight } from "@prisma/client";
import type { FlightLogEntry } from "../types";

export class FlightDataProcessor {
  private flightId: number | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly flightRepo: FlightRepository,
    private readonly telemetryRepo: TelemetryRepository,
    private readonly videoRepo: VideoRepository,
    private readonly trackingRepo: TrackingRepository
  ) {}

  static create(prisma: PrismaClient): FlightDataProcessor {
    return new FlightDataProcessor(
      prisma,
      new FlightRepository(prisma),
      new TelemetryRepository(prisma),
      new VideoRepository(prisma),
      new TrackingRepository(prisma)
    );
  }

  async processFlightData(input: {
    name?: string;
    date?: Date;
    description?: string;
    logPath?: string;
    videoPaths?: string[];
    trackingPaths?: string[];
    cameraFov?: number;
  }): Promise<Flight> {
    logger.info("Starting flight data processing", {
      name: input.name,
      date: input.date,
    });

    try {
      // 1. Create flight record
      const flight = await this.flightRepo.create({
        name: input.name,
        date: input.date,
        description: input.description,
        logPath: input.logPath,
      });
      this.flightId = flight.id;

      // 2. Process flight log if available
      const telemetryData = input.logPath
        ? await this.processFlightLog(input.logPath)
        : [];

      // 3. Process videos and tracking data
      if (input.videoPaths?.length && input.trackingPaths?.length) {
        await this.processVideosAndTracking(
          input.videoPaths,
          input.trackingPaths,
          telemetryData,
          input.cameraFov ?? 95
        );
      }

      logger.info("Flight data processing completed", { flightId: flight.id });
      return flight;
    } catch (error) {
      logger.error("Flight data processing failed", { error });
      throw error;
    }
  }

  private async processFlightLog(logPath: string) {
    logger.debug("Processing flight log", { path: logPath });

    if (!this.flightId) {
      throw new Error("Flight ID not set");
    }

    try {
      const content = await fs.readFile(logPath, "utf-8");
      const telemetryData = parseFlightLog(content);

      await this.telemetryRepo.createMany(this.flightId, telemetryData);

      logger.debug("Flight log processing completed", {
        entriesProcessed: telemetryData.length,
      });

      return telemetryData;
    } catch (error) {
      logger.error("Flight log processing failed", { error });
      throw error;
    }
  }

  private async processVideosAndTracking(
    videoPaths: string[],
    trackingPaths: string[],
    telemetryData: FlightLogEntry[],
    cameraFov: number
  ) {
    if (!this.flightId) {
      throw new Error("Flight ID not set");
    }

    const segments = findVideoSegments(telemetryData);
    logger.info("Found video segments", { count: segments.length });

    if (videoPaths.length !== segments.length) {
      throw new Error(
        `Video count (${videoPaths.length}) does not match segment count (${segments.length})`
      );
    }

    if (videoPaths.length !== trackingPaths.length) {
      throw new Error(
        `Video count (${videoPaths.length}) does not match tracking file count (${trackingPaths.length})`
      );
    }

    for (let i = 0; i < videoPaths.length; i++) {
      const videoPath = videoPaths[i];
      const trackingPath = trackingPaths[i];
      const segment = segments[i];

      logger.debug("Processing video", {
        index: i,
        video: videoPath,
        tracking: trackingPath,
      });

      try {
        const trackingContent = await fs.readFile(trackingPath, "utf-8");
        const { metadata, results } = parseTrackingData(trackingContent);

        const video = await this.videoRepo.create(
          this.flightId,
          metadata,
          videoPath
        );

        const segmentTelemetry = telemetryData.slice(
          segment.startIndex,
          segment.endIndex + 1
        );

        await this.trackingRepo.saveTrackingResults(
          video.id,
          results,
          segmentTelemetry,
          metadata,
          metadata.fps,
          cameraFov
        );

        logger.debug("Video processing completed", {
          videoId: video.id,
          framesProcessed: results.length,
        });
      } catch (error) {
        logger.error("Video processing failed", {
          error,
          videoPath,
          trackingPath,
        });
        throw error;
      }
    }
  }
}
