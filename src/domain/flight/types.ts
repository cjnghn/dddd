// src/domain/flight/types.ts

export interface VideoSegment {
  startTime: number; // milliseconds from start
  endTime: number; // milliseconds from start
  duration: number; // milliseconds
  startIndex: number; // log entry index
  endIndex: number; // log entry index
}

export interface FlightLogEntry {
  timeFromStart: number;
  timestamp: Date;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  isVideo: boolean;
}

export interface VideoMetadata {
  name: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
}

export interface TrackingResult {
  frameIndex: number;
  objects: TrackedObject[];
}

export interface TrackedObject {
  trackingId: number;
  boundingBox: [number, number, number, number];
  confidence: number;
  classId: number;
}
