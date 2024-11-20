// src/domain/flight/types/tracking.ts
export interface TrackedObject {
  trackingId: number;
  boundingBox: [number, number, number, number];
  confidence: number;
  classId: number;
}

export interface TrackingResult {
  frameIndex: number;
  objects: TrackedObject[];
}

export interface ObjectMetrics {
  pixelSpeed: number; // pixels per second
  groundSpeed: number; // meters per second
  location: {
    latitude: number;
    longitude: number;
  };
  courseHeading: number; // degrees from north
}

export interface ObjectWithMetrics extends TrackedObject {
  metrics?: ObjectMetrics;
}
