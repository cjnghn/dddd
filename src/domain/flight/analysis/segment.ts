// src/domain/flight/analysis/segment.ts
import { logger } from "../../../config/logger";
import type { FlightLogEntry, VideoSegment } from "../types";

export function findVideoSegments(
  logEntries: FlightLogEntry[]
): VideoSegment[] {
  logger.debug("Finding video segments from log entries", {
    totalEntries: logEntries.length,
  });

  const segments: VideoSegment[] = [];
  let currentSegment: Partial<VideoSegment> | null = null;

  logEntries.forEach((entry, index) => {
    if (entry.isVideo) {
      if (!currentSegment) {
        currentSegment = {
          startTime: entry.timeFromStart,
          startIndex: index,
        };
        logger.debug("Started new video segment", {
          time: entry.timeFromStart,
          index,
        });
      }
    } else if (currentSegment) {
      segments.push({
        startTime: currentSegment.startTime ?? 0,
        endTime: logEntries[index - 1].timeFromStart,
        duration:
          logEntries[index - 1].timeFromStart - (currentSegment.startTime ?? 0),
        startIndex: currentSegment.startIndex ?? 0,
        endIndex: index - 1,
      });
      logger.debug("Completed video segment", {
        startTime: currentSegment.startTime,
        endTime: logEntries[index - 1].timeFromStart,
      });
      currentSegment = null;
    }
  });

  // 마지막 세그먼트 처리
  if (currentSegment) {
    const lastEntry = logEntries[logEntries.length - 1];
    segments.push({
      startTime: currentSegment.startTime ?? 0,
      endTime: lastEntry.timeFromStart,
      duration: lastEntry.timeFromStart - (currentSegment.startTime ?? 0),
      startIndex: currentSegment.startIndex ?? 0,
      endIndex: logEntries.length - 1,
    });
  }

  logger.info("Video segment analysis completed", {
    segmentsFound: segments.length,
  });

  return segments;
}
