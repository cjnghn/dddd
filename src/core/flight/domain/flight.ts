// src/core/flight/domain/flight.ts
import { VideoMetadata } from "../../video/domain/video";

export interface FlightMetadata {
  name: string;
  date: Date;
  description?: string;
}

export interface FlightVideo {
  path: string;
  metadata: VideoMetadata;
}

export interface FlightSession {
  metadata: FlightMetadata;
  logPath?: string;
  videos: FlightVideo[];
  trackingPaths: string[];
}
