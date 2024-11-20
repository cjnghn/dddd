import { describe, it, expect } from "vitest";
import { interpolateTelemetry } from "../../../../src/domain/flight/analysis/interpolation";
import type { FlightLogEntry } from "../../../../src/domain/flight/types";

describe("interpolateTelemetry", () => {
  const sampleData: FlightLogEntry[] = [
    {
      timeFromStart: 0,
      latitude: 35.0,
      longitude: 139.0,
      altitude: 100,
      heading: 180,
      isVideo: true,
      timestamp: new Date("2024-11-20T00:00:00Z"),
    },
    {
      timeFromStart: 200,
      latitude: 35.1,
      longitude: 139.1,
      altitude: 110,
      heading: 185,
      isVideo: true,
      timestamp: new Date("2024-11-20T00:00:00.200Z"),
    },
  ];

  it("중간 시점의 값을 정확하게 보간", () => {
    const result = interpolateTelemetry(sampleData, 100);

    expect(result).toEqual({
      timeFromStart: 100,
      latitude: 35.05,
      longitude: 139.05,
      altitude: 105,
      heading: 182.5,
      isVideo: true,
      timestamp: new Date("2024-11-20T00:00:00.100Z"),
    });
  });

  it("360도를 걸치는 헤딩 각도 보간", () => {
    const testData = [
      { ...sampleData[0], heading: 350 },
      { ...sampleData[1], heading: 10 },
    ];

    const result = interpolateTelemetry(testData, 100);
    expect(result.heading).toBe(0);
  });

  it("시작 시점 이전은 첫 데이터 반환", () => {
    const result = interpolateTelemetry(sampleData, -100);
    expect(result).toEqual(sampleData[0]);
  });

  it("마지막 시점 이후는 마지막 데이터 반환", () => {
    const result = interpolateTelemetry(sampleData, 300);
    expect(result).toEqual(sampleData[1]);
  });

  it("빈 데이터에 대해 에러 발생", () => {
    expect(() => interpolateTelemetry([], 100)).toThrow(
      "No telemetry data available"
    );
  });
});
