// src/domain/flight/analysis/interpolation.ts
import type { FlightLogEntry } from "../types";
import { logger } from "../../../config/logger";

function interpolateValue(start: number, end: number, ratio: number): number {
  return start + (end - start) * ratio;
}

function interpolateHeading(start: number, end: number, ratio: number): number {
  // 각도 보간 시 최단 경로 고려
  let diff = end - start;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let result = start + diff * ratio;
  if (result < 0) result += 360;
  if (result >= 360) result -= 360;
  return result;
}

export function interpolateTelemetry(
  entries: FlightLogEntry[],
  targetTime: number
): FlightLogEntry {
  if (entries.length === 0) {
    throw new Error("No telemetry data available for interpolation");
  }

  // 범위를 벗어나는 경우 처리
  if (targetTime <= entries[0].timeFromStart) {
    return entries[0];
  }
  if (targetTime >= entries[entries.length - 1].timeFromStart) {
    return entries[entries.length - 1];
  }

  // 이진 검색으로 적절한 구간 찾기
  let left = 0;
  let right = entries.length - 1;

  while (left + 1 < right) {
    const mid = Math.floor((left + right) / 2);
    if (entries[mid].timeFromStart <= targetTime) {
      left = mid;
    } else {
      right = mid;
    }
  }

  const before = entries[left];
  const after = entries[left + 1];

  logger.debug("Interpolating telemetry", {
    targetTime,
    beforeTime: before.timeFromStart,
    afterTime: after.timeFromStart,
  });

  // 선형 보간
  const ratio =
    (targetTime - before.timeFromStart) /
    (after.timeFromStart - before.timeFromStart);

  return {
    timeFromStart: targetTime,
    timestamp: new Date(
      before.timestamp.getTime() +
        (after.timestamp.getTime() - before.timestamp.getTime()) * ratio
    ),
    latitude: interpolateValue(before.latitude, after.latitude, ratio),
    longitude: interpolateValue(before.longitude, after.longitude, ratio),
    altitude: interpolateValue(before.altitude, after.altitude, ratio),
    heading: interpolateHeading(before.heading, after.heading, ratio),
    isVideo: before.isVideo,
  };
}
