// src/core/telemetry/services/telemetry-parser.ts
import { parse } from "csv-parse/sync";
import { Result, err, ok } from "neverthrow";
import { z } from "zod";

import { CONSTANTS } from "../../../common/constants";
import { ValidationError } from "../../../common/errors/domain-error";
import { logger } from "../../../infrastructure/logging/logger";
import { TelemetryEntry } from "../domain/telemetry-entry";

export class TelemetryParser {
  /**
   * CSV 형식의 텔레메트리 데이터를 파싱
   */
  static parse(content: string): Result<TelemetryEntry[], ValidationError> {
    try {
      logger.debug("Starting telemetry data parsing");

      // CSV 파싱
      const parseResult = this.parseCSV(content);
      if (parseResult.isErr()) {
        return err(parseResult.error);
      }

      // 데이터 유효성 검증 및 변환
      const validationResult = this.validateAndTransform(parseResult.value);
      if (validationResult.isErr()) {
        return validationResult;
      }

      const entries = validationResult.value;

      // 시간 순서 검증
      const timeValidationResult = this.validateTimeSequence(entries);
      if (timeValidationResult.isErr()) {
        return timeValidationResult;
      }

      logger.info("Telemetry data parsed successfully", {
        entryCount: entries.length,
        timeRange: {
          start: entries[0].timestamp,
          end: entries[entries.length - 1].timestamp,
        },
      });

      return ok(entries);
    } catch (error) {
      logger.error("Unexpected error during telemetry parsing", { error });
      return err(
        new ValidationError(
          `Failed to parse telemetry data: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  /**
   * CSV 데이터를 파싱하여 raw 객체 배열로 변환
   */
  private static parseCSV(content: string): Result<unknown[], ValidationError> {
    try {
      if (!content.trim()) {
        return err(new ValidationError("Invalid CSV format: Empty content"));
      }

      const rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!Array.isArray(rows) || rows.length === 0) {
        return err(
          new ValidationError("Invalid CSV format: No data rows found"),
        );
      }

      return ok(rows);
    } catch (error) {
      logger.error("CSV parsing failed", { error });
      return err(
        new ValidationError(
          `Invalid CSV format: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  /**
   * row 데이터 검증 및 TelemetryEntry로 변환
   */
  private static validateAndTransform(
    rows: unknown[],
  ): Result<TelemetryEntry[], ValidationError> {
    const schema = z
      .object({
        "time(milliseond)": z.coerce.number(),
        "datetime(utc)": z.string().transform((str) => {
          const isoStr = str.replace(" ", "T") + (str.includes("Z") ? "" : "Z");
          const date = new Date(isoStr);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${str}`);
          }
          return date;
        }),
        latitude: z.coerce.number(),
        longitude: z.coerce.number(),
        "ascent(feet)": z
          .string()
          .transform((val) => Number(val) * CONSTANTS.UNITS.FEET_TO_METERS),
        "compass_heading(degrees)": z.coerce.number(),
        isVideo: z.string().transform((val) => val === "1"),
      })
      .transform((data) => ({
        timeFromStart: data["time(milliseond)"],
        timestamp: data["datetime(utc)"],
        latitude: data["latitude"],
        longitude: data["longitude"],
        altitude: data["ascent(feet)"],
        heading: data["compass_heading(degrees)"],
        isVideo: data["isVideo"],
      }));

    try {
      const entries = z.array(schema).parse(rows);
      return ok(entries);
    } catch (error) {
      logger.error("Data validation failed", { error });
      if (error instanceof z.ZodError) {
        return err(
          new ValidationError(
            `Data validation failed: ${error.errors.map((e) => e.message).join(", ")}`,
          ),
        );
      }
      return err(new ValidationError("Invalid data format"));
    }
  }

  /**
   * 시간 순서 및 간격 검증
   */
  private static validateTimeSequence(
    entries: TelemetryEntry[],
  ): Result<TelemetryEntry[], ValidationError> {
    if (entries.length === 0) {
      return err(new ValidationError("Empty telemetry data"));
    }

    let previousTime = entries[0].timeFromStart;

    for (let i = 1; i < entries.length; i++) {
      const currentTime = entries[i].timeFromStart;

      if (currentTime <= previousTime) {
        return err(
          new ValidationError(
            `Invalid time sequence at index ${i}: ` +
              `${currentTime}ms is not greater than ${previousTime}ms`,
          ),
        );
      }

      previousTime = currentTime;
    }

    return ok(entries);
  }
}
