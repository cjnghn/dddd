// src/domain/flight/analysis/metrics.ts
import type {
  FlightLogEntry,
  GeoPoint,
  ObjectMetrics,
  ObjectWithMetrics,
  VideoMetadata,
} from "../types";

const EARTH_RADIUS = 6371000; // meters

/**
 * 두 프레임 간의 바운딩 박스 중심점 간 픽셀 거리를 계산합니다.
 */
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

/**
 * 카메라의 FOV를 기반으로 픽셀당 실제 거리를 계산합니다.
 */
function calculateGroundResolution(
  altitude: number, // meters
  fovAngle: number, // degrees
  imageWidth: number // pixels
): number {
  // 고도에서의 FOV 너비 (meters)
  const groundWidth = 2 * altitude * Math.tan((fovAngle / 2) * (Math.PI / 180));
  // 픽셀당 실제 거리 (meters/pixel)
  return groundWidth / imageWidth;
}

/**
 * 이미지 상의 위치를 실제 GPS 좌표로 변환합니다.
 */
function calculateGeoLocation(
  droneLocation: GeoPoint,
  droneAltitude: number,
  droneHeading: number,
  fovAngle: number,
  imageWidth: number,
  imageHeight: number,
  pixelX: number,
  pixelY: number
): GeoPoint {
  // 이미지 중심으로부터의 상대적 위치 계산
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;
  const deltaX = pixelX - centerX;
  const deltaY = centerY - pixelY; // y축은 위아래가 반전됨

  // 픽셀 위치를 각도로 변환
  const pixelAngleX = (deltaX / imageWidth) * fovAngle;
  const pixelAngleY =
    (deltaY / imageHeight) * (fovAngle * (imageHeight / imageWidth));

  // 드론 위치로부터의 거리 계산
  const distance =
    droneAltitude *
    Math.sqrt(
      Math.tan(pixelAngleX * (Math.PI / 180)) ** 2 +
        Math.tan(pixelAngleY * (Math.PI / 180)) ** 2
    );

  // 방향 각도 계산 (드론의 헤딩 고려)
  const bearing =
    (droneHeading + Math.atan2(deltaX, deltaY) * (180 / Math.PI) + 360) % 360;

  // Haversine 공식을 사용하여 새로운 좌표 계산
  const bearingRad = bearing * (Math.PI / 180);
  const lat1 = droneLocation.latitude * (Math.PI / 180);
  const lon1 = droneLocation.longitude * (Math.PI / 180);
  const angularDistance = distance / EARTH_RADIUS;

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

/**
 * 두 프레임 사이의 객체 메트릭을 계산합니다.
 */
export function calculateObjectMetrics(
  prevObject: ObjectWithMetrics | null,
  currentObject: ObjectWithMetrics,
  timeDelta: number, // seconds
  droneData: FlightLogEntry,
  videoMeta: VideoMetadata,
  cameraFov: number // degrees
): ObjectMetrics {
  // 픽셀 속도 계산
  const pixelSpeed = prevObject
    ? calculatePixelDistance(
        prevObject.boundingBox,
        currentObject.boundingBox
      ) / timeDelta
    : 0;

  // 실제 거리 속도 계산
  const groundResolution = calculateGroundResolution(
    droneData.altitude,
    cameraFov,
    videoMeta.width
  );
  const groundSpeed = pixelSpeed * groundResolution;

  // 객체의 이미지 상 위치 계산
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

    // 두 GPS 좌표 간의 방향 계산
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
