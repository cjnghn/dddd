// src/schemas/index.ts
import { z } from "zod";

export const TelemetrySchema = z.object({
  "time(millisecond)": z.string().transform((str) => Number.parseInt(str)),
  latitude: z.string().transform((str) => {
    const lat = Number.parseFloat(str);
    if (lat < -90 || lat > 90) throw new Error("Invalid latitude");
    return lat;
  }),
  longitude: z.string().transform((str) => {
    const lon = Number.parseFloat(str);
    if (lon < -180 || lon > 180) throw new Error("Invalid longitude");
    return lon;
  }),
  "altitude(feet)": z.string().transform((str) => Number.parseFloat(str)),
  "compass_heading(degrees)": z
    .string()
    .transform((str) => Number.parseFloat(str)),
  isVideo: z.string().transform((str) => str === "1"),
});

export const TrackingSchema = z.object({
  model: z.object({
    name: z.string(),
    confidence_threshold: z.number(),
    nms: z.boolean(),
  }),
  tracker: z.object({
    name: z.string(),
  }),
  video: z.object({
    name: z.string(),
    width: z.number(),
    height: z.number(),
    fps: z.number(),
    total_frames: z.number(),
  }),
  tracking_results: z.array(
    z.object({
      i: z.number(),
      res: z.array(
        z.object({
          tid: z.number(),
          bbox: z.array(z.number()).length(4),
          conf: z.number(),
          cid: z.number(),
        })
      ),
    })
  ),
});
