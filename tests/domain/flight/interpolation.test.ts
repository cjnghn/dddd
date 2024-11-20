// tests/domain/flight/interpolation.test.ts
import { describe, it, expect } from "vitest";
import { interpolateTelemetry } from "../../../src/domain/flight/interpolation";
import type { FlightLogEntry } from "../../../src/domain/flight/types";

describe("텔레메트리 보간 테스트", () => {
  const sampleData: FlightLogEntry[] = [
    {
      timeFromStart: 0,
      timestamp: new Date("2024-03-20T10:00:00Z"),
      latitude: 35.0,
      longitude: 139.0,
      altitude: 100,
      heading: 180,
      isVideo: true,
    },
    {
      timeFromStart: 200,
      timestamp: new Date("2024-03-20T10:00:00.200Z"),
      latitude: 35.1,
      longitude: 139.1,
      altitude: 110,
      heading: 185,
      isVideo: true,
    },
  ];

  it("중간 시점의 값을 정확하게 보간해야 함", () => {
    const result = interpolateTelemetry(sampleData, 100);
    expect(result).toEqual({
      timeFromStart: 100,
      timestamp: new Date("2024-03-20T10:00:00.100Z"),
      latitude: 35.05,
      longitude: 139.05,
      altitude: 105,
      heading: 182.5,
      isVideo: true,
    });
  });

  it("360도를 걸치는 헤딩 각도를 올바르게 보간해야 함", () => {
    const data: FlightLogEntry[] = [
      { ...sampleData[0], heading: 350 },
      { ...sampleData[1], heading: 10 },
    ];

    const result = interpolateTelemetry(data, 100);
    expect(result.heading).toBe(0); // 350도와 10도 사이의 중간값
  });

  it("데이터 범위 이전 시점은 첫 번째 데이터를 반환해야 함", () => {
    const result = interpolateTelemetry(sampleData, -100);
    expect(result).toEqual(sampleData[0]);
  });

  it("데이터 범위 이후 시점은 마지막 데이터를 반환해야 함", () => {
    const result = interpolateTelemetry(sampleData, 300);
    expect(result).toEqual(sampleData[1]);
  });

  it("빈 데이터 배열에 대해 에러를 발생시켜야 함", () => {
    expect(() => interpolateTelemetry([], 100)).toThrow(
      "No telemetry data available"
    );
  });
});
