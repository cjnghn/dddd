// src/domain/flight/repositories/tracking.ts
import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";
import type {
  FlightLogEntry,
  TrackingResult,
  TrackedObject,
  VideoMetadata,
  ObjectWithMetrics,
} from "../types";
import { calculateObjectMetrics } from "../analysis/metrics";
import { interpolateTelemetry } from "../analysis/interpolation";

export class TrackingRepository {
  constructor(private prisma: PrismaClient) {}

  async saveTrackingResults(
    videoId: number,
    results: TrackingResult[],
    telemetry: FlightLogEntry[],
    videoMeta: VideoMetadata,
    fps: number,
    cameraFov: number
  ): Promise<void> {
    logger.debug("Starting tracking results processing", {
      videoId,
      frameCount: results.length,
    });

    const previousObjects = new Map<number, ObjectWithMetrics>();

    for (const result of results) {
      const frameTime = (result.frameIndex / fps) * 1000;
      const interpolated =
        telemetry.length > 0
          ? interpolateTelemetry(telemetry, frameTime)
          : null;

      const frame = await this.createFrame(
        videoId,
        result.frameIndex,
        interpolated
      );

      if (result.objects.length > 0 && interpolated) {
        await this.processFrameObjects(
          videoId,
          frame.id,
          result.objects,
          previousObjects,
          interpolated,
          videoMeta,
          fps,
          cameraFov
        );
      }
    }

    logger.info("Tracking results processing completed", { videoId });
  }

  private async processFrameObjects(
    videoId: number,
    frameId: number,
    objects: TrackedObject[],
    previousObjects: Map<number, ObjectWithMetrics>,
    telemetry: FlightLogEntry,
    videoMeta: VideoMetadata,
    fps: number,
    cameraFov: number
  ): Promise<void> {
    const objectsWithMetrics = objects.map((obj) => {
      const prevObject = previousObjects.get(obj.trackingId);
      const metrics = calculateObjectMetrics(
        prevObject,
        obj,
        1 / fps,
        telemetry,
        videoMeta,
        cameraFov
      );

      const objectWithMetrics: ObjectWithMetrics = {
        ...obj,
        metrics,
      };

      previousObjects.set(obj.trackingId, objectWithMetrics);
      return objectWithMetrics;
    });

    await this.createObjects(videoId, frameId, objectsWithMetrics);
  }

  private async createFrame(
    videoId: number,
    frameIndex: number,
    telemetry: FlightLogEntry | null
  ) {
    return this.prisma.frame.create({
      data: {
        videoId,
        frameIndex,
        timestamp: telemetry?.timestamp ?? new Date(),
        latitude: telemetry?.latitude,
        longitude: telemetry?.longitude,
        altitude: telemetry?.altitude,
        heading: telemetry?.heading,
      },
    });
  }

  private async createObjects(
    videoId: number,
    frameId: number,
    objects: ObjectWithMetrics[]
  ) {
    return this.prisma.object.createMany({
      data: objects.map((obj) => ({
        videoId,
        frameId,
        tid: obj.trackingId,
        bbox: JSON.stringify(obj.boundingBox),
        conf: obj.confidence,
        cid: obj.classId,
        pixelSpeed: obj.metrics?.pixelSpeed,
        groundSpeed: obj.metrics?.groundSpeed,
        latitude: obj.metrics?.location.latitude,
        longitude: obj.metrics?.location.longitude,
        courseHeading: obj.metrics?.courseHeading,
      })),
    });
  }
}
