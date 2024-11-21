// src/core/video/domain/segment-matcher.ts
import { Result, err, ok } from "neverthrow";

import { ProcessingError } from "../../../common/errors/domain-error";
import { logger } from "../../../infrastructure/logging/logger";
import { TelemetrySegment } from "../../telemetry/domain/telemetry-segment";
import { VideoMetadata } from "./video";

export class SegmentMatcher {
  static matchSegmentsWithVideos(
    segments: TelemetrySegment[],
    videos: { path: string; metadata: VideoMetadata }[],
  ): Result<Map<string, TelemetrySegment>, ProcessingError> {
    try {
      if (segments.length !== videos.length) {
        return err(
          new ProcessingError(
            `Number of video segments (${segments.length}) does not match ` +
              `number of video files (${videos.length})`,
          ),
        );
      }

      const sortedVideos = [...videos].sort((a, b) =>
        a.path.localeCompare(b.path),
      );

      const mapping = new Map<string, TelemetrySegment>();

      segments.forEach((segment, index) => {
        const video = sortedVideos[index];
        mapping.set(video.path, segment);

        logger.debug("Mapped video to segment", {
          videoPath: video.path,
          segmentStart: segment.startTime,
          segmentEnd: segment.endTime,
        });
      });

      return ok(mapping);
    } catch (error) {
      logger.error("Failed to match segments with videos", { error });
      return err(
        new ProcessingError(
          `Failed to match segments with videos: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  static validateSegmentDuration(
    segment: TelemetrySegment,
    metadata: VideoMetadata,
    toleranceMs: number = 100,
  ): Result<true, ProcessingError> {
    const expectedDuration = (metadata.totalFrames / metadata.fps) * 1000;
    const durationDiff = Math.abs(segment.duration - expectedDuration);

    if (durationDiff > toleranceMs) {
      return err(
        new ProcessingError(
          `Segment duration (${segment.duration}ms) significantly differs ` +
            `from video duration (${expectedDuration}ms)`,
        ),
      );
    }

    return ok(true);
  }
}
