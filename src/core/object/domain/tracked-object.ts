// src/core/object/domain/tracked-object.ts
export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TrackedObject {
  trackingId: number;
  boundingBox: BoundingBox;
  confidence: number;
  classId: number;
}

export interface TrackedObjectMetrics {
  pixelSpeed: number; // pixels per second
  groundSpeed: number; // meters per second
  location: {
    latitude: number;
    longitude: number;
  };
  courseHeading: number; // degrees from north
}

export interface TrackedObjectWithMetrics extends TrackedObject {
  metrics: TrackedObjectMetrics;
}
