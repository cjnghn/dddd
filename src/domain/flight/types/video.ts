// src/domain/flight/types/video.ts
export interface VideoMetadata {
  name: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
}

export interface VideoSegment {
  startTime: number; // milliseconds from start
  endTime: number; // milliseconds from start
  duration: number; // milliseconds
  startIndex: number; // log entry index
  endIndex: number; // log entry index
}
