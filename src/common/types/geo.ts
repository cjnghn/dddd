// src/common/types/geo.ts
export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface GeoMetrics {
  distance: number; // meters
  bearing: number; // degrees
  speed?: number; // meters per second
}
