// tests/domain/flight/analysis/metrics.test.ts
import { describe, it, expect } from "vitest";
import { calculateObjectMetrics } from "../../../../src/domain/flight/analysis/metrics";
import type {
  FlightLogEntry,
  VideoMetadata,
  ObjectWithMetrics,
} from "../../../../src/domain/flight/types";

describe("객체 메트릭 계산", () => {
  const sampleDroneData: FlightLogEntry = {
    timeFromStart: 0,
    timestamp: new Date(),
    latitude: 35.123,
    longitude: 139.456,
    altitude: 100,
    heading: 90,
    isVideo: true,
  };

  const sampleVideoMeta: VideoMetadata = {
    name: "test.mp4",
    width: 1920,
    height: 1080,
    fps: 30,
    totalFrames: 100,
  };

  it("정지된 객체의 속도가 0이어야 함", () => {
    const object: ObjectWithMetrics = {
      trackingId: 1,
      boundingBox: [100, 100, 200, 200],
      confidence: 0.9,
      classId: 1,
    };

    const metrics = calculateObjectMetrics(
      object,
      object,
      1 / 30,
      sampleDroneData,
      sampleVideoMeta,
      95
    );

    expect(metrics.pixelSpeed).toBe(0);
    expect(metrics.groundSpeed).toBe(0);
  });

  it("이동하는 객체의 속도를 계산해야 함", () => {
    const prevObject: ObjectWithMetrics = {
      trackingId: 1,
      boundingBox: [100, 100, 200, 200],
      confidence: 0.9,
      classId: 1,
    };

    const currentObject: ObjectWithMetrics = {
      trackingId: 1,
      boundingBox: [150, 150, 250, 250],
      confidence: 0.9,
      classId: 1,
    };

    const metrics = calculateObjectMetrics(
      prevObject,
      currentObject,
      1 / 30,
      sampleDroneData,
      sampleVideoMeta,
      95
    );

    expect(metrics.pixelSpeed).toBeGreaterThan(0);
    expect(metrics.groundSpeed).toBeGreaterThan(0);
    expect(metrics.courseHeading).toBeDefined();
  });

  it("GPS 좌표가 드론 위치 근처에 있어야 함", () => {
    const object: ObjectWithMetrics = {
      trackingId: 1,
      boundingBox: [
        sampleVideoMeta.width / 2 - 50,
        sampleVideoMeta.height / 2 - 50,
        sampleVideoMeta.width / 2 + 50,
        sampleVideoMeta.height / 2 + 50,
      ],
      confidence: 0.9,
      classId: 1,
    };

    const metrics = calculateObjectMetrics(
      null,
      object,
      1 / 30,
      sampleDroneData,
      sampleVideoMeta,
      95
    );

    // 이미지 중앙의 객체는 드론 위치와 비슷한 GPS 좌표를 가져야 함
    expect(
      Math.abs(metrics.location.latitude - sampleDroneData.latitude)
    ).toBeLessThan(0.001);
    expect(
      Math.abs(metrics.location.longitude - sampleDroneData.longitude)
    ).toBeLessThan(0.001);
  });
});
