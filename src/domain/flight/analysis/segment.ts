// src/domain/flight/analysis/segment.ts
import type { FlightLogEntry, VideoSegment } from "../types";

/**
 * 비행 로그에서 비디오 촬영 구간을 추출합니다.
 * isVideo 값이 연속적으로 1인 구간을 찾아서 반환합니다.
 */
export function findVideoSegments(
  logEntries: FlightLogEntry[]
): VideoSegment[] {
  const segments: VideoSegment[] = [];
  let currentSegment: Partial<VideoSegment> | null = null;

  logEntries.forEach((entry, index) => {
    if (entry.isVideo) {
      if (!currentSegment) {
        currentSegment = {
          startTime: entry.timeFromStart,
          startIndex: index,
        };
      }
    } else if (currentSegment) {
      // 비디오 구간이 끝난 경우
      segments.push({
        startTime: currentSegment.startTime!,
        endTime: logEntries[index - 1].timeFromStart,
        duration:
          logEntries[index - 1].timeFromStart - currentSegment.startTime!,
        startIndex: currentSegment.startIndex!,
        endIndex: index - 1,
      });
      currentSegment = null;
    }
  });

  // 마지막 세그먼트가 로그 끝까지 이어지는 경우
  if (currentSegment) {
    const lastEntry = logEntries[logEntries.length - 1];
    segments.push({
      startTime: currentSegment.startTime!,
      endTime: lastEntry.timeFromStart,
      duration: lastEntry.timeFromStart - currentSegment.startTime!,
      startIndex: currentSegment.startIndex!,
      endIndex: logEntries.length - 1,
    });
  }

  return segments;
}

/**
 * 비디오 파일들을 비행 로그의 비디오 구간과 매핑합니다.
 * 비디오 개수가 구간 개수와 일치하지 않으면 에러를 발생시킵니다.
 */
export function mapVideosToSegments(
  segments: VideoSegment[],
  videoFiles: string[]
): Map<string, VideoSegment> {
  if (segments.length !== videoFiles.length) {
    throw new Error(
      `비디오 파일 수(${videoFiles.length})가 로그의 비디오 구간 수(${segments.length})와 일치하지 않습니다.`
    );
  }

  // 파일명 순으로 정렬하여 매핑
  const sortedFiles = [...videoFiles].sort();
  return new Map(
    segments.map((segment, index) => [sortedFiles[index], segment])
  );
}
