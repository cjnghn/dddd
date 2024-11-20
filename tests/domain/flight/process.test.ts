// tests/domain/flight/process.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { processFlightData } from "../../../src/domain/flight/process";
import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs/promises";

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    flight: {
      create: vi.fn().mockResolvedValue({ id: 1, name: "Test Flight" }),
    },
    telemetry: {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    video: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    frame: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    object: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  })),
}));

vi.mock("node:fs/promises");

describe("비행 데이터 처리 통합 테스트", () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  it("비행 로그 없이 기본 정보만 처리할 수 있어야 함", async () => {
    const input = {
      name: "Test Flight",
      date: new Date("2024-03-20"),
      description: "Test description",
    };

    await processFlightData(prisma, input);

    expect(prisma.flight.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        date: input.date,
        description: input.description,
        flightLog: "",
      },
    });

    expect(prisma.telemetry.createMany).not.toHaveBeenCalled();
    expect(prisma.video.create).not.toHaveBeenCalled();
  });

  it("모든 데이터가 제공된 경우 전체 처리 과정을 수행해야 함", async () => {
    const csvContent = `time(millisecond),datetime(utc),latitude,longitude,ascent(feet),compass_heading(degrees),isVideo
0,2024-09-11 05:47:13,35.123,139.456,100,180,1
200,2024-09-11 05:47:13.200,35.124,139.457,110,185,1`;

    const trackingContent = JSON.stringify({
      model: {
        name: "yolov11s_v4_2560_b8_e60",
        confidence_threshold: 0.3,
        nms: true,
      },
      tracker: { name: "bytetrack" },
      video: {
        name: "DJI_0268",
        width: 2688,
        height: 1512,
        fps: 29.97,
        total_frames: 10535,
      },
      tracking_results: [
        {
          i: 0,
          res: [
            {
              tid: 1,
              bbox: [100, 200, 300, 400],
              conf: 0.968,
              cid: 1,
            },
          ],
        },
      ],
    });

    vi.mocked(fs.readFile)
      .mockResolvedValueOnce(csvContent)
      .mockResolvedValueOnce(trackingContent);

    const input = {
      name: "Test Flight",
      date: new Date("2024-03-20"),
      description: "Test description",
      logPath: "test.csv",
      videoPath: "test.mp4",
      trackingPath: "test.json",
    };

    await processFlightData(prisma, input);

    // Flight 생성 확인
    expect(prisma.flight.create).toHaveBeenCalled();

    // Telemetry 데이터 생성 확인
    expect(prisma.telemetry.createMany).toHaveBeenCalled();

    // Video 생성 확인
    expect(prisma.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "DJI_0268",
          width: 2688,
          height: 1512,
          fps: 29.97,
          totalFrames: 10535,
        }),
      })
    );

    // Frame과 Object 생성 확인
    expect(prisma.frame.create).toHaveBeenCalled();
    expect(prisma.object.createMany).toHaveBeenCalled();
  });

  it("파일 읽기 실패 시 적절한 에러를 발생시켜야 함", async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

    const input = {
      name: "Test Flight",
      date: new Date("2024-03-20"),
      logPath: "nonexistent.csv",
    };

    await expect(processFlightData(prisma, input)).rejects.toThrow();
  });

  // it("잘못된 형식의 파일 내용에 대해 적절한 에러를 발생시켜야 함", async () => {
  //   vi.mocked(fs.readFile).mockResolvedValue("invalid,csv,content");

  //   const input = {
  //     name: "Test Flight",
  //     date: new Date("2024-03-20"),
  //     logPath: "invalid.csv",
  //   };

  //   await expect(processFlightData(prisma, input)).rejects.toThrow();
  // });
});
