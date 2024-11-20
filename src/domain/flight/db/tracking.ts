// src/domain/flight/db/tracking.ts
import type { PrismaClient } from "@prisma/client";
import type { TrackingResult, TrackedObject, FlightLogEntry } from "../types";
import { interpolateTelemetry } from "../interpolation";

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
  fps: number
) {
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

    if (result.objects.length > 0) {
      await createObjects(prisma, videoId, frame.id, result.objects);
    }
  }
}
