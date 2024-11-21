// src/common/constants/index.ts
export const CONSTANTS = {
  UNITS: {
    FEET_TO_METERS: 0.3048,
    EARTH_RADIUS_METERS: 6371000,
  },
  DEFAULT_VALUES: {
    CAMERA_FOV: 84, // DJI MINI 2
  },
  PATHS: {
    UPLOADS: {
      ROOT: "uploads",
      LOGS: "uploads/logs",
      VIDEOS: "uploads/videos",
      TRACKING: "uploads/tracking",
    },
  },
} as const;
