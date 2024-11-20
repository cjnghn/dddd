// src/domain/flight/db/tracking.ts
import type { PrismaClient } from "@prisma/client";
import type {
  TrackingResult,
  TrackedObject,
  FlightLogEntry,
  VideoMetadata,
  ObjectWithMetrics,
} from "../types";
import { interpolateTelemetry } from "../interpolation";
import { calculateObjectMetrics } from "../analysis/metrics";

async function createFrame(
  prisma: PrismaClient,
  videoId: number,
  frameIndex: number,
  interpolatedTelemetry: FlightLogEntry | null
) {
  return prisma.frame.create({
    data: {
      videoId,
      frameIndex,
      timestamp: interpolatedTelemetry?.timestamp ?? new Date(),
      latitude: interpolatedTelemetry?.latitude,
      longitude: interpolatedTelemetry?.longitude,
      altitude: interpolatedTelemetry?.altitude,
      heading: interpolatedTelemetry?.heading,
    },
  });
}

async function createObjects(
  prisma: PrismaClient,
  videoId: number,
  frameId: number,
  objects: TrackedObject[]
) {
  return prisma.object.createMany({
    data: objects.map((obj) => ({
      videoId,
      frameId,
      tid: obj.trackingId,
      bbox: JSON.stringify(obj.boundingBox),
      conf: obj.confidence,
      cid: obj.classId,
    })),
  });
}

export async function saveTrackingResults(
  prisma: PrismaClient,
  videoId: number,
  results: TrackingResult[],
  telemetry: FlightLogEntry[],
  videoMeta: VideoMetadata,
  fps: number,
  cameraFov = 83 // DJI 드론 카메라의 일반적인 FOV
) {
  // 객체 추적을 위한 이전 프레임 데이터 저장
  const previousObjects = new Map<number, ObjectWithMetrics>();

  for (const result of results) {
    const frameTime = (result.frameIndex / fps) * 1000;
    const interpolated =
      telemetry.length > 0 ? interpolateTelemetry(telemetry, frameTime) : null;

    const frame = await createFrame(
      prisma,
      videoId,
      result.frameIndex,
      interpolated
    );

    if (result.objects.length > 0 && interpolated) {
      // 각 객체의 메트릭 계산
      const objectsWithMetrics = result.objects.map((obj) => {
        const prevObject = previousObjects.get(obj.trackingId) ?? null;
        const metrics = calculateObjectMetrics(
          prevObject,
          obj,
          1 / fps,
          interpolated,
          videoMeta,
          cameraFov
        );

        // 현재 객체를 다음 프레임 계산을 위해 저장
        previousObjects.set(obj.trackingId, {
          ...obj,
          metrics,
        });

        return {
          ...obj,
          metrics,
        };
      });

      // 메트릭을 포함하여 DB에 저장
      await prisma.object.createMany({
        data: objectsWithMetrics.map((obj) => ({
          videoId,
          frameId: frame.id,
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
}
