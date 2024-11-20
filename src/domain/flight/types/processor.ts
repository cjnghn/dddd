import type { Flight } from "@prisma/client";
import type { VideoSegment } from "../types";

// src/domain/flight/types/processor.ts
export interface FlightProcessor {
  processLog(logPath: string): Promise<VideoSegment[]>;
  processVideos(
    videoPaths: string[],
    trackingPaths: string[],
    cameraFov: number
  ): Promise<void>;
  getFlight(): Promise<Flight>;
}
