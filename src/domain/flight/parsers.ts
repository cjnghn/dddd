// src/domain/flight/parsers.ts
import { z } from "zod";
import { parse } from "csv-parse/sync";
import type { FlightLogEntry, TrackingResult, VideoMetadata } from "./types";
import { flightLogEntrySchema, trackingFileSchema } from "./validators";

const FEET_TO_METERS = 0.3048;

// CSV 컬럼 이름과 실제 데이터 매핑을 위한 타입
type RawFlightLogRow = {
  "time(millisecond)": string;
  "datetime(utc)": string;
  latitude: string;
  longitude: string;
  "ascent(feet)": string;
  "compass_heading(degrees)": string;
  isVideo: string;
};

/**
 * UTC 날짜 문자열을 Date 객체로 변환
 * 여러 포맷 지원: '2024-09-11 05:47:13' 또는 '2024-03-20T10:00:00.200Z'
 */
function parseUtcDateTime(dateStr: string): Date {
  // 스페이스로 구분된 포맷을 ISO 포맷으로 변환
  const isoStr = dateStr.replace(" ", "T") + (dateStr.includes("Z") ? "" : "Z");
  const date = new Date(isoStr);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  return date;
}

const flightLogRowSchema = z
  .object({
    "time(millisecond)": z.string().transform(Number),
    "datetime(utc)": z.string().transform(parseUtcDateTime),
    latitude: z.string().transform(Number),
    longitude: z.string().transform(Number),
    "ascent(feet)": z.string().transform((val) => Number(val) * FEET_TO_METERS),
    "compass_heading(degrees)": z.string().transform(Number),
    isVideo: z.string().transform((val) => val === "1"),
  })
  .transform(
    (data): FlightLogEntry => ({
      timeFromStart: data["time(millisecond)"],
      timestamp: data["datetime(utc)"],
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data["ascent(feet)"],
      heading: data["compass_heading(degrees)"],
      isVideo: data.isVideo,
    })
  );

export function parseFlightLog(content: string): FlightLogEntry[] {
  try {
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as RawFlightLogRow[];

    return z.array(flightLogRowSchema).parse(rows);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse flight log: ${error.message}`);
    }
    throw error;
  }
}

export function parseTrackingData(content: string): {
  metadata: VideoMetadata;
  results: TrackingResult[];
} {
  try {
    const data = trackingFileSchema.parse(JSON.parse(content));
    return {
      metadata: data.video,
      results: data.tracking_results,
    };
  } catch (error) {
    throw new Error(`Failed to parse tracking data: ${error}`);
  }
}
