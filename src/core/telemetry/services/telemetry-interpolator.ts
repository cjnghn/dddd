// src/core/telemetry/services/telemetry-interpolator.ts
import { Result, err, ok } from "neverthrow";

import { ProcessingError } from "../../../common/errors/domain-error";
import { logger } from "../../../infrastructure/logging/logger";
import { TelemetryEntry } from "../domain/telemetry-entry";

export class TelemetryInterpolator {
  /**
   * 특정 시점의 텔레메트리 데이터를 보간하여 계산
   */
  static interpolate(
    entries: TelemetryEntry[],
    targetTime: number,
  ): Result<TelemetryEntry, ProcessingError> {
    try {
      if (entries.length === 0) {
        return err(
          new ProcessingError("No telemetry data available for interpolation"),
        );
      }

      // 범위를 벗어나는 경우 처리
      if (targetTime <= entries[0].timeFromStart) {
        return ok(entries[0]);
      }
      if (targetTime >= entries[entries.length - 1].timeFromStart) {
        return ok(entries[entries.length - 1]);
      }

      // 이진 검색으로 적절한 구간 찾기
      const index = this.findInterpolationIndex(entries, targetTime);
      const before = entries[index];
      const after = entries[index + 1];

      // 보간 비율 계산
      const ratio =
        (targetTime - before.timeFromStart) /
        (after.timeFromStart - before.timeFromStart);

      const interpolated: TelemetryEntry = {
        timeFromStart: targetTime,
        timestamp: this.interpolateDate(
          before.timestamp,
          after.timestamp,
          ratio,
        ),
        latitude: this.interpolateLinear(
          before.latitude,
          after.latitude,
          ratio,
        ),
        longitude: this.interpolateLinear(
          before.longitude,
          after.longitude,
          ratio,
        ),
        altitude: this.interpolateLinear(
          before.altitude,
          after.altitude,
          ratio,
        ),
        heading: this.interpolateHeading(before.heading, after.heading, ratio),
        isVideo: before.isVideo, // 비디오 상태는 이전 값을 유지
      };

      logger.debug("Interpolated telemetry data", {
        targetTime,
        ratio,
        originalRange: {
          start: before.timeFromStart,
          end: after.timeFromStart,
        },
      });

      return ok(interpolated);
    } catch (error) {
      logger.error("Failed to interpolate telemetry data", { error });
      return err(
        new ProcessingError(
          `Interpolation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  /**
   * 이진 검색으로 보간할 데이터 구간 찾기
   */
  private static findInterpolationIndex(
    entries: TelemetryEntry[],
    targetTime: number,
  ): number {
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

    return left;
  }

  /**
   * 선형 보간
   */
  private static interpolateLinear(
    start: number,
    end: number,
    ratio: number,
  ): number {
    return start + (end - start) * ratio;
  }

  /**
   * 날짜/시간 보간
   */
  private static interpolateDate(start: Date, end: Date, ratio: number): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    return new Date(startTime + (endTime - startTime) * ratio);
  }

  /**
   * 각도(헤딩) 보간 - 최단 경로로 보간
   */
  private static interpolateHeading(
    start: number,
    end: number,
    ratio: number,
  ): number {
    // 각도 차이 계산 (최단 경로)
    let diff = end - start;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // 보간
    let result = start + diff * ratio;

    // 결과값을 0-360 범위로 정규화
    if (result < 0) result += 360;
    if (result >= 360) result -= 360;

    return result;
  }
}
