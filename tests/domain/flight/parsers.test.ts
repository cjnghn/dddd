import { describe, it, expect } from "vitest";
import { parseFlightLog } from "../../../src/domain/flight/parsers";

describe("parseFlightLog", () => {
  it("공백으로 구분된 날짜시간 형식의 비행 로그를 파싱해야 함", () => {
    const csvContent = `time(millisecond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,35.123,139.456,100,180,1
200,2024-09-11 05:47:13.200,35.124,139.457,110,185,1`;

    const result = parseFlightLog(csvContent);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      timeFromStart: 0,
      timestamp: new Date("2024-09-11T05:47:13Z"),
      latitude: 35.123,
      longitude: 139.456,
      altitude: 30.48, // 100피트를 미터로 변환
      heading: 180,
      isVideo: true,
    });
  });

  it("ISO 형식의 날짜시간을 가진 비행 로그를 파싱해야 함", () => {
    const csvContent = `time(millisecond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-03-20T10:00:00.000Z,35.123,139.456,100,180,1
200,2024-03-20T10:00:00.200Z,35.124,139.457,110,185,1`;

    const result = parseFlightLog(csvContent);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      timeFromStart: 0,
      timestamp: new Date("2024-03-20T10:00:00.000Z"),
      latitude: 35.123,
      longitude: 139.456,
      altitude: 30.48,
      heading: 180,
      isVideo: true,
    });
  });

  it("날짜시간에 밀리초가 없는 경우를 처리해야 함", () => {
    const csvContent = `time(millisecond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,35.123,139.456,100,180,1`;

    const result = parseFlightLog(csvContent);
    expect(result[0].timestamp).toEqual(new Date("2024-09-11T05:47:13Z"));
  });

  it("잘못된 날짜시간 형식에 대해 에러를 발생시켜야 함", () => {
    const csvContent = `time(millisecond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,invalid-date,35.123,139.456,100,180,1`;

    expect(() => parseFlightLog(csvContent)).toThrow("Invalid date format");
  });

  it("빈 줄을 처리해야 함", () => {
    const csvContent = `time(millisecond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,35.123,139.456,100,180,1

200,2024-09-11 05:47:13.200,35.124,139.457,110,185,1`;

    const result = parseFlightLog(csvContent);
    expect(result).toHaveLength(2);
  });
});
