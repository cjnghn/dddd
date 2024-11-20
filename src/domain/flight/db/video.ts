import type { PrismaClient } from "@prisma/client";
import type { VideoMetadata } from "../types";

export function createVideo(
  prisma: PrismaClient,
  flightId: number,
  metadata: VideoMetadata,
  filePath: string
) {
  return prisma.video.create({
    data: {
      flightId,
      name: metadata.name,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      totalFrames: metadata.totalFrames,
      filePath,
    },
  });
}
