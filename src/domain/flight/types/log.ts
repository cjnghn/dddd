// src/domain/flight/types/log.ts
export interface FlightLogEntry {
  timeFromStart: number; // milliseconds
  timestamp: Date; // UTC
  latitude: number; // degrees
  longitude: number; // degrees
  altitude: number; // meters
  heading: number; // degrees
  isVideo: boolean;
}

export interface RawFlightLogRow {
  "time(milliseond)": string;
  "datetime(utc)": string;
  latitude: string;
  longitude: string;
  "ascent(feet)": string;
  "compass_heading(degrees)": string;
  isVideo: string;
}
