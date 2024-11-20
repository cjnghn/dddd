// src/scripts/parseTrackingData.ts
import fs from "node:fs";
import { TrackingSchema } from "../schemas";
import { prisma } from "../lib/prisma";

export const parseTrackingData = async (
  trackingPath: string,
  videoId: number
): Promise<void> => {
  const rawData = fs.readFileSync(trackingPath, "utf8");
  const trackingData = TrackingSchema.parse(JSON.parse(rawData));

  await prisma.video.update({
    where: { id: videoId },
    data: {
      width: trackingData.video.width,
      height: trackingData.video.height,
      fps: trackingData.video.fps,
      totalFrames: trackingData.video.total_frames,
    },
  });

  const batchSize = 1000;
  for (let i = 0; i < trackingData.tracking_results.length; i += batchSize) {
    const batch = trackingData.tracking_results.slice(i, i + batchSize);

    // 프레임 생성 (중복 처리)
    for (const result of batch) {
      const existingFrame = await prisma.frame.findUnique({
        where: {
          id: videoId,
          frameIndex: result.i,
        },
      });

      if (!existingFrame) {
        await prisma.frame.create({
          data: {
            videoId,
            frameIndex: result.i,
            timestamp: new Date(), // Will be updated by mapTelemetryToFrames
          },
        });
      }

      // 객체 생성
      for (const obj of result.res) {
        await prisma.object.create({
          data: {
            frameId: existingFrame?.id ?? result.i,
            videoId,
            tid: obj.tid,
            bbox: JSON.stringify(obj.bbox),
            conf: obj.conf,
            cid: obj.cid,
          },
        });
      }
    }
  }
};
