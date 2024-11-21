// src/core/object/services/metrics-calculator.ts
import { Result, err, ok } from "neverthrow";

import { CONSTANTS } from "../../../common/constants";
import { ProcessingError } from "../../../common/errors/domain-error";
import { GeoPoint } from "../../../common/types/geo";
import { logger } from "../../../infrastructure/logging/logger";
import { VideoMetadata } from "../../video/domain/video";
import {
  BoundingBox,
  TrackedObject,
  TrackedObjectMetrics,
  TrackedObjectWithMetrics,
} from "../domain/tracked-object";

export class MetricsCalculator {
  /**
   * 객체의 현재 위치와 속도를 계산
   */
  static calculateMetrics(
    currentObject: TrackedObject,
    previousObject: TrackedObjectWithMetrics | null,
    dronePosition: GeoPoint & { heading: number },
    videoMetadata: VideoMetadata,
    timeDelta: number,
    cameraFov: number,
  ): Result<TrackedObjectMetrics, ProcessingError> {
    try {
      // 픽셀 속도 계산
      const pixelSpeed = previousObject
        ? this.calculatePixelSpeed(previousObject, currentObject, timeDelta)
        : 0;

      // 실제 거리 속도 계산
      const groundResolution = this.calculateGroundResolution(
        dronePosition.altitude ?? 0,
        cameraFov,
        videoMetadata.width,
      );
      const groundSpeed = pixelSpeed * groundResolution;

      // 객체의 지리적 위치 계산
      const location = this.calculateGeoLocation(
        dronePosition,
        currentObject.boundingBox,
        videoMetadata,
        cameraFov,
      );

      // 이동 방향 계산
      const courseHeading =
        previousObject && previousObject.metrics
          ? this.calculateCourseHeading(
              previousObject.metrics.location,
              location,
            )
          : dronePosition.heading;

      const metrics: TrackedObjectMetrics = {
        pixelSpeed,
        groundSpeed,
        location,
        courseHeading,
      };

      logger.debug("Calculated object metrics", {
        trackingId: currentObject.trackingId,
        metrics,
      });

      return ok(metrics);
    } catch (error) {
      logger.error("Failed to calculate object metrics", { error });
      return err(
        new ProcessingError(
          `Failed to calculate metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  private static calculatePixelSpeed(
    previous: TrackedObject,
    current: TrackedObject,
    timeDelta: number,
  ): number {
    const prevCenter = this.getBoundingBoxCenter(previous.boundingBox);
    const currentCenter = this.getBoundingBoxCenter(current.boundingBox);

    const distance = Math.sqrt(
      Math.pow(currentCenter.x - prevCenter.x, 2) +
        Math.pow(currentCenter.y - prevCenter.y, 2),
    );

    return distance / timeDelta;
  }

  private static calculateGroundResolution(
    altitude: number,
    fovAngle: number,
    imageWidth: number,
  ): number {
    // 고도에서의 FOV 너비 (meters)
    const groundWidth =
      2 * altitude * Math.tan((fovAngle / 2) * (Math.PI / 180));
    // 픽셀당 실제 거리 (meters/pixel)
    return groundWidth / imageWidth;
  }

  private static getBoundingBoxCenter(box: BoundingBox): {
    x: number;
    y: number;
  } {
    return {
      x: (box.x1 + box.x2) / 2,
      y: (box.y1 + box.y2) / 2,
    };
  }

  private static calculateGeoLocation(
    dronePosition: GeoPoint & { heading: number },
    boundingBox: BoundingBox,
    videoMetadata: VideoMetadata,
    cameraFov: number,
  ): { latitude: number; longitude: number } {
    const center = this.getBoundingBoxCenter(boundingBox);

    // 이미지 중심으로부터의 상대적 위치
    const deltaX = center.x - videoMetadata.width / 2;
    const deltaY = videoMetadata.height / 2 - center.y; // y축은 반전

    // 각도 계산
    const pixelAngleX = (deltaX / videoMetadata.width) * cameraFov;
    const pixelAngleY =
      (deltaY / videoMetadata.height) *
      (cameraFov * (videoMetadata.height / videoMetadata.width));

    // 드론으로부터의 거리 계산
    const distance =
      (dronePosition.altitude ?? 0) *
      Math.sqrt(
        Math.pow(Math.tan(pixelAngleX * (Math.PI / 180)), 2) +
          Math.pow(Math.tan(pixelAngleY * (Math.PI / 180)), 2),
      );

    // 방향 각도 계산
    const bearing =
      (dronePosition.heading +
        Math.atan2(deltaX, deltaY) * (180 / Math.PI) +
        360) %
      360;

    // Haversine 공식으로 새로운 좌표 계산
    const lat1 = dronePosition.latitude * (Math.PI / 180);
    const lon1 = dronePosition.longitude * (Math.PI / 180);
    const bearingRad = bearing * (Math.PI / 180);
    const angularDistance = distance / CONSTANTS.UNITS.EARTH_RADIUS_METERS;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad),
    );

    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
      );

    return {
      latitude: lat2 * (180 / Math.PI),
      longitude: lon2 * (180 / Math.PI),
    };
  }

  private static calculateCourseHeading(
    prevLocation: { latitude: number; longitude: number },
    currentLocation: { latitude: number; longitude: number },
  ): number {
    const lat1 = prevLocation.latitude * (Math.PI / 180);
    const lat2 = currentLocation.latitude * (Math.PI / 180);
    const deltaLon =
      (currentLocation.longitude - prevLocation.longitude) * (Math.PI / 180);

    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

    let heading = Math.atan2(y, x) * (180 / Math.PI);
    if (heading < 0) {
      heading += 360;
    }

    return heading;
  }
}
