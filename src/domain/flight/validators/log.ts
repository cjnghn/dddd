// src/domain/flight/validators/log.ts
import { z } from "zod";
import { CONSTANTS } from "../../../config/constants";

/**
 * UTC 날짜 문자열을 Date 객체로 변환
 */
function parseUtcDateTime(dateStr: string): Date {
  const isoStr = dateStr.replace(" ", "T") + (dateStr.includes("Z") ? "" : "Z");
  const date = new Date(isoStr);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  return date;
}

export const flightLogRowSchema = z
  .object({
    "time(millisecond)": z.string().transform(Number),
    "datetime(utc)": z.string().transform(parseUtcDateTime),
    latitude: z.string().transform(Number),
    longitude: z.string().transform(Number),
    "ascent(feet)": z
      .string()
      .transform((val) => Number(val) * CONSTANTS.FEET_TO_METERS),
    "compass_heading(degrees)": z.string().transform(Number),
    isVideo: z.string().transform((val) => val === "1"),
  })
  .transform((data) => ({
    timeFromStart: data["time(millisecond)"],
    timestamp: data["datetime(utc)"],
    latitude: data.latitude,
    longitude: data.longitude,
    altitude: data["ascent(feet)"],
    heading: data["compass_heading(degrees)"],
    isVideo: data.isVideo,
  }));
