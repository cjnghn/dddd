// tests/domain/flight/analysis/segment.test.ts
import { describe, it, expect } from "vitest";
import {
  findVideoSegments,
  mapVideosToSegments,
} from "../../../../src/domain/flight/analysis/segment";
import type { FlightLogEntry } from "../../../../src/domain/flight/types";

describe("비디오 세그먼트 분석", () => {
  it("연속된 비디오 구간을 정확히 찾아야 함", () => {
    const logEntries: FlightLogEntry[] = [
      { timeFromStart: 0, isVideo: false } as FlightLogEntry,
      { timeFromStart: 200, isVideo: true } as FlightLogEntry,
      { timeFromStart: 400, isVideo: true } as FlightLogEntry,
      { timeFromStart: 600, isVideo: false } as FlightLogEntry,
      { timeFromStart: 800, isVideo: true } as FlightLogEntry,
      { timeFromStart: 1000, isVideo: true } as FlightLogEntry,
      { timeFromStart: 1200, isVideo: true } as FlightLogEntry,
    ];

    const segments = findVideoSegments(logEntries);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({
      startTime: 200,
      endTime: 400,
      duration: 200,
      startIndex: 1,
      endIndex: 2,
    });
    expect(segments[1]).toEqual({
      startTime: 800,
      endTime: 1200,
      duration: 400,
      startIndex: 4,
      endIndex: 6,
    });
  });

  it("로그 끝까지 이어지는 비디오 구간을 처리해야 함", () => {
    const logEntries: FlightLogEntry[] = [
      { timeFromStart: 0, isVideo: false } as FlightLogEntry,
      { timeFromStart: 200, isVideo: true } as FlightLogEntry,
      { timeFromStart: 400, isVideo: true } as FlightLogEntry,
    ];

    const segments = findVideoSegments(logEntries);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({
      startTime: 200,
      endTime: 400,
      duration: 200,
      startIndex: 1,
      endIndex: 2,
    });
  });

  it("비디오 구간이 없는 경우 빈 배열을 반환해야 함", () => {
    const logEntries: FlightLogEntry[] = [
      { timeFromStart: 0, isVideo: false } as FlightLogEntry,
      { timeFromStart: 200, isVideo: false } as FlightLogEntry,
    ];

    const segments = findVideoSegments(logEntries);
    expect(segments).toHaveLength(0);
  });
});

describe("비디오 파일 매핑", () => {
  const segments = [
    {
      startTime: 200,
      endTime: 400,
      duration: 200,
      startIndex: 1,
      endIndex: 2,
    },
    {
      startTime: 800,
      endTime: 1200,
      duration: 400,
      startIndex: 4,
      endIndex: 6,
    },
  ];

  it("비디오 파일을 세그먼트와 올바르게 매핑해야 함", () => {
    const videoFiles = ["/path/to/DJI_0001.MP4", "/path/to/DJI_0002.MP4"];

    const mapping = mapVideosToSegments(segments, videoFiles);

    expect(mapping.size).toBe(2);
    expect(mapping.get("/path/to/DJI_0001.MP4")).toEqual(segments[0]);
    expect(mapping.get("/path/to/DJI_0002.MP4")).toEqual(segments[1]);
  });

  it("파일 수가 세그먼트 수와 다른 경우 에러를 발생시켜야 함", () => {
    const videoFiles = ["/path/to/DJI_0001.MP4"];

    expect(() => mapVideosToSegments(segments, videoFiles)).toThrow(
      /비디오 파일 수.*가 로그의 비디오 구간 수.*와 일치하지 않습니다/
    );
  });
});
