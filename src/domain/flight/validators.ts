// src/domain/flight/validators.ts
import { z } from "zod";

export const flightLogEntrySchema = z
  .object({
    time: z.string().transform(Number),
    datetime: z.string().transform((str) => new Date(str)),
    latitude: z.string().transform(Number),
    longitude: z.string().transform(Number),
    ascent: z.string().transform((val) => Number(val) * 0.3048), // feet to meters
    compass_heading: z.string().transform(Number),
    isVideo: z.string().transform((val) => val === "1"),
  })
  .transform((data) => ({
    timeFromStart: data.time,
    timestamp: data.datetime,
    latitude: data.latitude,
    longitude: data.longitude,
    altitude: data.ascent,
    heading: data.compass_heading,
    isVideo: data.isVideo,
  }));

export const videoMetadataSchema = z
  .object({
    name: z.string(),
    width: z.number(),
    height: z.number(),
    fps: z.number(),
    total_frames: z.number(),
  })
  .transform((data) => ({
    name: data.name,
    width: data.width,
    height: data.height,
    fps: data.fps,
    totalFrames: data.total_frames,
  }));

export const trackedObjectSchema = z
  .object({
    tid: z.number(),
    bbox: z.array(z.number()).length(4),
    conf: z.number(),
    cid: z.number(),
  })
  .transform((data) => ({
    trackingId: data.tid,
    boundingBox: data.bbox as [number, number, number, number],
    confidence: data.conf,
    classId: data.cid,
  }));

export const trackingResultSchema = z
  .object({
    i: z.number(),
    res: z.array(trackedObjectSchema),
  })
  .transform((data) => ({
    frameIndex: data.i,
    objects: data.res,
  }));

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
