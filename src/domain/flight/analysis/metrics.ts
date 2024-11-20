// src/domain/flight/analysis/metrics.ts
import { CONSTANTS } from "../../../config/constants";
import type {
  FlightLogEntry,
  ObjectMetrics,
  ObjectWithMetrics,
  VideoMetadata,
} from "../types";

function calculatePixelDistance(
  bbox1: [number, number, number, number],
  bbox2: [number, number, number, number]
): number {
  const center1 = {
    x: (bbox1[0] + bbox1[2]) / 2,
    y: (bbox1[1] + bbox1[3]) / 2,
  };
  const center2 = {
    x: (bbox2[0] + bbox2[2]) / 2,
    y: (bbox2[1] + bbox2[3]) / 2,
  };

  return Math.sqrt((center2.x - center1.x) ** 2 + (center2.y - center1.y) ** 2);
}

function calculateGroundResolution(
  altitude: number,
  fovAngle: number,
  imageWidth: number
): number {
  const groundWidth = 2 * altitude * Math.tan((fovAngle / 2) * (Math.PI / 180));
  return groundWidth / imageWidth;
}

function calculateGeoLocation(
  droneLocation: { latitude: number; longitude: number },
  droneAltitude: number,
  droneHeading: number,
  fovAngle: number,
  imageWidth: number,
  imageHeight: number,
  pixelX: number,
  pixelY: number
): { latitude: number; longitude: number } {
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;
  const deltaX = pixelX - centerX;
  const deltaY = centerY - pixelY;

  const pixelAngleX = (deltaX / imageWidth) * fovAngle;
  const pixelAngleY =
    (deltaY / imageHeight) * (fovAngle * (imageHeight / imageWidth));

  const distance =
    droneAltitude *
    Math.sqrt(
      Math.tan(pixelAngleX * (Math.PI / 180)) ** 2 +
        Math.tan(pixelAngleY * (Math.PI / 180)) ** 2
    );

  const bearing =
    (droneHeading + Math.atan2(deltaX, deltaY) * (180 / Math.PI) + 360) % 360;

  const lat1 = droneLocation.latitude * (Math.PI / 180);
  const lon1 = droneLocation.longitude * (Math.PI / 180);
  const angularDistance = distance / CONSTANTS.EARTH_RADIUS;
  const bearingRad = bearing * (Math.PI / 180);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: lat2 * (180 / Math.PI),
    longitude: lon2 * (180 / Math.PI),
  };
}

export function calculateObjectMetrics(
  prevObject: ObjectWithMetrics | null,
  currentObject: ObjectWithMetrics,
  timeDelta: number,
  droneData: FlightLogEntry,
  videoMeta: VideoMetadata,
  cameraFov: number
): ObjectMetrics {
  // 픽셀 속도 계산
  const pixelSpeed = prevObject
    ? calculatePixelDistance(
        prevObject.boundingBox,
        currentObject.boundingBox
      ) / timeDelta
    : 0;

  // 지상 속도 계산
  const groundResolution = calculateGroundResolution(
    droneData.altitude,
    cameraFov,
    videoMeta.width
  );
  const groundSpeed = pixelSpeed * groundResolution;

  // 객체의 중심점 계산
  const centerX =
    (currentObject.boundingBox[0] + currentObject.boundingBox[2]) / 2;
  const centerY =
    (currentObject.boundingBox[1] + currentObject.boundingBox[3]) / 2;

  // GPS 위치 계산
  const location = calculateGeoLocation(
    {
      latitude: droneData.latitude,
      longitude: droneData.longitude,
    },
    droneData.altitude,
    droneData.heading,
    cameraFov,
    videoMeta.width,
    videoMeta.height,
    centerX,
    centerY
  );

  // 이동 방향 계산
  let courseHeading = 0;
  if (prevObject) {
    const prevLocation = calculateGeoLocation(
      {
        latitude: droneData.latitude,
        longitude: droneData.longitude,
      },
      droneData.altitude,
      droneData.heading,
      cameraFov,
      videoMeta.width,
      videoMeta.height,
      (prevObject.boundingBox[0] + prevObject.boundingBox[2]) / 2,
      (prevObject.boundingBox[1] + prevObject.boundingBox[3]) / 2
    );

    const deltaLon = location.longitude - prevLocation.longitude;
    const y =
      Math.sin(deltaLon * (Math.PI / 180)) *
      Math.cos(location.latitude * (Math.PI / 180));
    const x =
      Math.cos(prevLocation.latitude * (Math.PI / 180)) *
        Math.sin(location.latitude * (Math.PI / 180)) -
      Math.sin(prevLocation.latitude * (Math.PI / 180)) *
        Math.cos(location.latitude * (Math.PI / 180)) *
        Math.cos(deltaLon * (Math.PI / 180));
    courseHeading = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
  }

  return {
    pixelSpeed,
    groundSpeed,
    location,
    courseHeading,
  };
}
