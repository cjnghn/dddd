// src/core/video/domain/video.ts
export interface VideoMetadata {
  name: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
}

export interface VideoFrame {
  index: number;
  timestamp: Date;
  position: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    heading?: number;
  };
}
