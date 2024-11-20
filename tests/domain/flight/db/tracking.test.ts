// tests/domain/flight/db/tracking.test.ts
import { describe, it, expect, vi } from "vitest";
import { saveTrackingResults } from "../../../../src/domain/flight/db/tracking";
import type { PrismaClient } from "@prisma/client";

describe("트래킹 결과 데이터베이스 저장 테스트", () => {
  const mockPrisma = {
    frame: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    object: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as PrismaClient;

  it("프레임과 객체 데이터를 올바르게 저장해야 함", async () => {
    const results = [
      {
        frameIndex: 0,
        objects: [
          {
            trackingId: 1,
            boundingBox: [0, 0, 100, 100],
            confidence: 0.9,
            classId: 1,
          },
        ],
      },
    ];

    const telemetry = [
      {
        timeFromStart: 0,
        timestamp: new Date(),
        latitude: 35.0,
        longitude: 139.0,
        altitude: 100,
        heading: 180,
        isVideo: true,
      },
    ];

    await saveTrackingResults(mockPrisma, 1, results, telemetry, 30);

    expect(mockPrisma.frame.create).toHaveBeenCalled();
    expect(mockPrisma.object.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          videoId: 1,
          frameId: 1,
          tid: 1,
          bbox: "[0,0,100,100]",
        }),
      ]),
    });
  });

  it("텔레메트리 데이터가 없는 경우에도 처리할 수 있어야 함", async () => {
    const results = [
      {
        frameIndex: 0,
        objects: [
          {
            trackingId: 1,
            boundingBox: [0, 0, 100, 100],
            confidence: 0.9,
            classId: 1,
          },
        ],
      },
    ];

    await saveTrackingResults(mockPrisma, 1, results, [], 30);

    expect(mockPrisma.frame.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          videoId: 1,
          frameIndex: 0,
          latitude: null,
          longitude: null,
        }),
      })
    );
  });
});
