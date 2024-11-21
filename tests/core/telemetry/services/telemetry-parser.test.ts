// tests/core/telemetry/services/telemetry-parser.test.ts
import { describe, it, expect } from "vitest";
import { TelemetryParser } from "../../../../src/core/telemetry/services/telemetry-parser";

describe("TelemetryParser", () => {
  const validCsvContent = `time(milliseond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,35.123,139.456,100,180,1
200,2024-09-11 05:47:13.200,35.124,139.457,110,185,1
400,2024-09-11 05:47:13.400,35.125,139.458,120,190,0`;

  it("유효한 CSV 데이터를 성공적으로 파싱해야 함", () => {
    const result = TelemetryParser.parse(validCsvContent);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const entries = result.value;
      expect(entries).toHaveLength(3);

      // 첫 번째 항목 검증
      expect(entries[0]).toEqual({
        timeFromStart: 0,
        timestamp: new Date("2024-09-11T05:47:13Z"),
        latitude: 35.123,
        longitude: 139.456,
        altitude: 30.48, // 100 feet to meters
        heading: 180,
        isVideo: true,
      });

      // 값 변환 검증
      expect(entries[1].altitude).toBeCloseTo(33.528); // 110 feet to meters
      expect(entries[2].isVideo).toBe(false);
    }
  });

  it("빈 줄이 있는 CSV를 처리해야 함", () => {
    const csvWithEmptyLines = `time(milliseond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,35.123,139.456,100,180,1

200,2024-09-11 05:47:13.200,35.124,139.457,110,185,1`;

    const result = TelemetryParser.parse(csvWithEmptyLines);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
    }
  });

  it("잘못된 CSV 형식에 대해 에러를 반환해야 함", () => {
    const invalidCsv = "invalid,csv,content";
    const result = TelemetryParser.parse(invalidCsv);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Invalid CSV format");
    }
  });

  it("필수 컬럼이 없는 경우 에러를 반환해야 함", () => {
    const missingColumns = `time(milliseond),latitude,longitude
0,35.123,139.456`;

    const result = TelemetryParser.parse(missingColumns);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Data validation failed");
    }
  });

  it("잘못된 데이터 형식에 대해 에러를 반환해야 함", () => {
    // 잘못된 점: latitude가 숫자가 아닌 문자열
    const invalidData = `time(milliseond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,invalid,139.456,100,180,1`;

    const result = TelemetryParser.parse(invalidData);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Data validation failed");
    }
  });

  it("잘못된 날짜 형식에 대해 에러를 반환해야 함", () => {
    const invalidDate = `time(milliseond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,invalid-date,35.123,139.456,100,180,1`;

    const result = TelemetryParser.parse(invalidDate);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Invalid data format");
    }
  });

  it("시간 순서가 잘못된 경우 에러를 반환해야 함", () => {
    const invalidTimeSequence = `time(milliseond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
200,2024-09-11 05:47:13.200,35.123,139.456,100,180,1
0,2024-09-11 05:47:13.000,35.124,139.457,110,185,1`;

    const result = TelemetryParser.parse(invalidTimeSequence);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Invalid time sequence");
    }
  });

  it("빈 파일에 대해 에러를 반환해야 함", () => {
    const emptyFile = "";
    const result = TelemetryParser.parse(emptyFile);

    expect(result.isErr()).toBe(true);
  });

  it("다양한 날짜/시간 형식을 처리해야 함", () => {
    const differentDateFormats = `time(milliseond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,35.123,139.456,100,180,1
200,2024-09-11T05:47:13.200Z,35.124,139.457,110,185,1`;

    const result = TelemetryParser.parse(differentDateFormats);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value[0].timestamp).toEqual(
        new Date("2024-09-11T05:47:13Z"),
      );
      expect(result.value[1].timestamp).toEqual(
        new Date("2024-09-11T05:47:13.200Z"),
      );
    }
  });
});
