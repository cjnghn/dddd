// src/core/video/services/frame-analyzer.ts
import { Result, err, ok } from "neverthrow";

import { ProcessingError } from "../../../common/errors/domain-error";
import { logger } from "../../../infrastructure/logging/logger";
import { TelemetryEntry } from "../../telemetry/domain/telemetry-entry";
import { TelemetryInterpolator } from "../../telemetry/services/telemetry-interpolator";
import { VideoFrame, VideoMetadata } from "../domain/video";

export class FrameAnalyzer {
  static async generateFrameData(
    telemetry: TelemetryEntry[],
    metadata: VideoMetadata,
    timeOffset: number = 0,
  ): Promise<Result<VideoFrame[], ProcessingError>> {
    try {
      const frames: VideoFrame[] = [];

      for (let i = 0; i < metadata.totalFrames; i++) {
        const frameTimeMs = timeOffset + (i / metadata.fps) * 1000;

        const interpolationResult = TelemetryInterpolator.interpolate(
          telemetry,
          frameTimeMs,
        );

        if (interpolationResult.isErr()) {
          return err(
            new ProcessingError(
              `Frame interpolation failed at frame ${i}: ${interpolationResult.error.message}`,
            ),
          );
        }

        const data = interpolationResult.value;
        frames.push({
          index: i,
          timestamp: data.timestamp,
          position: {
            latitude: data.latitude,
            longitude: data.longitude,
            altitude: data.altitude,
            heading: data.heading,
          },
        });

        if (i % 100 === 0) {
          logger.debug("Frame data generation progress", {
            frame: i,
            totalFrames: metadata.totalFrames,
          });
        }
      }

      return ok(frames);
    } catch (error) {
      logger.error("Failed to generate frame data", { error });
      return err(
        new ProcessingError(
          `Failed to generate frame data: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }
}
