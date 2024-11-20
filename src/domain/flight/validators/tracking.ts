// src/domain/flight/validators/tracking.ts
import { z } from "zod";
import type { TrackedObject, TrackingResult, VideoMetadata } from "../types";

export const trackedObjectSchema = z
  .object({
    tid: z.number(),
    bbox: z.array(z.number()).length(4),
    conf: z.number(),
    cid: z.number(),
  })
  .transform(
    (data): TrackedObject => ({
      trackingId: data.tid,
      boundingBox: data.bbox as [number, number, number, number],
      confidence: data.conf,
      classId: data.cid,
    })
  );

export const trackingResultSchema = z
  .object({
    i: z.number(),
    res: z.array(trackedObjectSchema),
  })
  .transform(
    (data): TrackingResult => ({
      frameIndex: data.i,
      objects: data.res,
    })
  );

export const videoMetadataSchema = z
  .object({
    name: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    fps: z.number().positive(),
    total_frames: z.number().positive(),
  })
  .transform(
    (data): VideoMetadata => ({
      name: data.name,
      width: data.width,
      height: data.height,
      fps: data.fps,
      totalFrames: data.total_frames,
    })
  );

export const trackingFileSchema = z.object({
  model: z.object({
    name: z.string(),
    confidence_threshold: z.number(),
    nms: z.boolean(),
  }),
  tracker: z.object({
    name: z.string(),
  }),
  video: videoMetadataSchema,
  tracking_results: z.array(trackingResultSchema),
});
