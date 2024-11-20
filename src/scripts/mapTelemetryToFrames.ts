// src/scripts/mapTelemetryToFrames.ts
import { prisma } from "../lib/prisma";
import { interpolate } from "../utils/interpolation";

export const mapTelemetryToFrames = async (flightId: number): Promise<void> => {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      videos: {
        include: { frames: true },
      },
      telemetry: {
        select: {
          timeFromStartMS: true,
          latitude: true,
          longitude: true,
          altitude: true,
          heading: true,
        },
        orderBy: { timeFromStartMS: "asc" },
      },
    },
  });

  if (!flight || !flight.telemetry.length) {
    throw new Error(`Flight ${flightId} not found or has no telemetry data`);
  }

  for (const video of flight.videos) {
    const timeValues = flight.telemetry.map((t) => t.timeFromStartMS);
    const latitudes = flight.telemetry.map((t) => t.latitude);
    const longitudes = flight.telemetry.map((t) => t.longitude);
    const altitudes = flight.telemetry.map((t) => t.altitude);
    const headings = flight.telemetry.map((t) => t.heading);

    // 각 프레임의 시간 계산
    const frameTimes = video.frames.map((frame) =>
      Math.floor(frame.frameIndex * (1000 / video.fps))
    );

    // 보간 계산
    const interpolatedLats = interpolate(timeValues, latitudes, frameTimes);
    const interpolatedLons = interpolate(timeValues, longitudes, frameTimes);
    const interpolatedAlts = interpolate(timeValues, altitudes, frameTimes);
    const interpolatedHeadings = interpolate(timeValues, headings, frameTimes);

    // 프레임 업데이트
    for (const [idx, frame] of video.frames.entries()) {
      await prisma.frame.update({
        where: { id: frame.id },
        data: {
          timestamp: new Date(frameTimes[idx]),
          latitude: interpolatedLats[idx],
          longitude: interpolatedLons[idx],
          altitude: interpolatedAlts[idx],
          heading: interpolatedHeadings[idx],
        },
      });
    }
  }
};
