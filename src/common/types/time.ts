// src/common/types/time.ts
export interface TimeRange {
  startTime: number; // milliseconds
  endTime: number; // milliseconds
}

export interface TimeSegment extends TimeRange {
  duration: number;
}
