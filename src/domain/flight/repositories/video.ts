// src/domain/flight/repositories/video.ts
import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";
import type { VideoMetadata } from "../types";

export class VideoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(flightId: number, metadata: VideoMetadata, filePath: string) {
    logger.debug("Creating video record", {
      flightId,
      videoName: metadata.name,
    });

    return this.prisma.video.create({
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

  async findByFlightId(flightId: number) {
    return this.prisma.video.findMany({
      where: { flightId },
      include: {
        frames: {
          include: {
            objects: true,
          },
        },
      },
    });
  }
}
