// tests/core/telemetry/services/telemetry-interpolator.test.ts
import { describe, expect, it } from "vitest";

import { TelemetryEntry } from "../../../../src/core/telemetry/domain/telemetry-entry";
import { TelemetryInterpolator } from "../../../../src/core/telemetry/services/telemetry-interpolator";

describe("TelemetryInterpolator", () => {
  const sampleData: TelemetryEntry[] = [
    {
      timeFromStart: 0,
      timestamp: new Date("2024-03-20T10:00:00.000Z"),
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
    const result = TelemetryInterpolator.interpolate(sampleData, 100);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const interpolated = result.value;
      expect(interpolated).toEqual({
        timeFromStart: 100,
        timestamp: new Date("2024-03-20T10:00:00.100Z"),
        latitude: 35.05,
        longitude: 139.05,
        altitude: 105,
        heading: 182.5,
        isVideo: true,
      });
    }
  });

  it("데이터 범위를 벗어난 경우 가장 가까운 값을 반환해야 함", () => {
    const beforeRange = TelemetryInterpolator.interpolate(sampleData, -100);
    expect(beforeRange.isOk()).toBe(true);
    if (beforeRange.isOk()) {
      expect(beforeRange.value).toEqual(sampleData[0]);
    }

    const afterRange = TelemetryInterpolator.interpolate(sampleData, 300);
    expect(afterRange.isOk()).toBe(true);
    if (afterRange.isOk()) {
      expect(afterRange.value).toEqual(sampleData[1]);
    }
  });

  it("360도를 걸치는 헤딩 각도를 올바르게 보간해야 함", () => {
    const data: TelemetryEntry[] = [
      { ...sampleData[0], heading: 350 },
      { ...sampleData[1], heading: 10 },
    ];

    const result = TelemetryInterpolator.interpolate(data, 100);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.heading).toBe(0);
    }
  });

  it("빈 데이터에 대해 에러를 반환해야 함", () => {
    const result = TelemetryInterpolator.interpolate([], 100);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("No telemetry data available");
    }
  });

  it("정확한 시간대의 값을 요청하면 해당 값을 그대로 반환해야 함", () => {
    const result = TelemetryInterpolator.interpolate(sampleData, 0);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(sampleData[0]);
    }
  });

  it("시간 정밀도를 유지해야 함", () => {
    const preciseData: TelemetryEntry[] = [
      {
        timeFromStart: 0,
        timestamp: new Date("2024-03-20T10:00:00.123Z"),
        latitude: 35.0,
        longitude: 139.0,
        altitude: 100,
        heading: 180,
        isVideo: true,
      },
      {
        timeFromStart: 50,
        timestamp: new Date("2024-03-20T10:00:00.173Z"),
        latitude: 35.05,
        longitude: 139.05,
        altitude: 105,
        heading: 182.5,
        isVideo: true,
      },
    ];

    const result = TelemetryInterpolator.interpolate(preciseData, 25);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.timestamp.getTime()).toBe(
        new Date("2024-03-20T10:00:00.148Z").getTime(),
      );
    }
  });

  it("모든 수치 값이 정확하게 보간되어야 함", () => {
    const result = TelemetryInterpolator.interpolate(sampleData, 100);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const interpolated = result.value;

      // 위도 보간 검증
      expect(interpolated.latitude).toBeCloseTo(35.05, 6);

      // 경도 보간 검증
      expect(interpolated.longitude).toBeCloseTo(139.05, 6);

      // 고도 보간 검증
      expect(interpolated.altitude).toBeCloseTo(105, 6);

      // 헤딩 보간 검증
      expect(interpolated.heading).toBeCloseTo(182.5, 6);
    }
  });
});
