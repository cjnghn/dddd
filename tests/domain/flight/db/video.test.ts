// tests/domain/flight/db/video.test.ts
import { describe, it, expect, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createVideo } from "../../../../src/domain/flight/db/video";

describe("비디오 데이터베이스 처리 테스트", () => {
  it("비디오 메타데이터를 올바르게 저장해야 함", async () => {
    const mockPrisma = {
      video: {
        create: vi.fn().mockResolvedValue({ id: 1 }),
      },
    } as unknown as PrismaClient;

    const metadata = {
      name: "test.mp4",
      width: 1920,
      height: 1080,
      fps: 30,
      totalFrames: 300,
    };

    await createVideo(mockPrisma, 1, metadata, "/path/to/video.mp4");

    expect(mockPrisma.video.create).toHaveBeenCalledWith({
      data: {
        flightId: 1,
        name: metadata.name,
        width: metadata.width,
        height: metadata.height,
        fps: metadata.fps,
        totalFrames: metadata.totalFrames,
        filePath: "/path/to/video.mp4",
      },
    });
  });
});
