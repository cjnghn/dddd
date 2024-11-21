// src/core/object/domain/tracking-result.ts
import { TrackedObject } from "./tracked-object";

export interface TrackingResult {
  frameIndex: number;
  objects: TrackedObject[];
}

export interface TrackingMetadata {
  model: {
    name: string;
    confidenceThreshold: number;
    nms: boolean;
  };
  tracker: {
    name: string;
  };
}
