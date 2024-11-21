// src/core/telemetry/domain/telemetry-entry.ts
import { GeoPoint } from "../../../common/types/geo";

export interface TelemetryEntry extends GeoPoint {
  timeFromStart: number; // milliseconds
  timestamp: Date; // UTC
  heading: number; // degrees
  isVideo: boolean;
}

export type RawTelemetryRow = {
  "time(milliseond)": string;
  "datetime(utc)": string;
  latitude: string;
  longitude: string;
  "ascent(feet)": string;
  "compass_heading(degrees)": string;
  isVideo: string;
};
