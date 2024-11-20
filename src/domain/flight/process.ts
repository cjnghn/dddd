// src/domain/flight/process.ts
import fs from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { parseFlightLog, parseTrackingData } from "./parsers";
import { createFlight } from "./db/flight";
import { createTelemetryEntries } from "./db/telemetry";
import { saveTrackingResults } from "./db/tracking";
import { createVideo } from "./db/video";
import type { FlightLogEntry, VideoSegment } from "./types";
import { findVideoSegments, mapVideosToSegments } from "./analysis/segment";
import type { InputSchema } from "../../scripts/commands/process-flight";

export async function processFlightData(
  prisma: PrismaClient,
  input: InputSchema
) {
  const cameraFov = input.cameraFov;

  // 1. Create flight record
  const flight = await createFlight(prisma, {
    name: input.name,
    date: input.date,
    description: input.description,
    logPath: input.logPath,
  });

  // 2. Process flight log and find video segments
  let telemetryData: FlightLogEntry[] = [];
  let videoSegments: VideoSegment[] = [];

  if (input.logPath) {
    const content = await fs.readFile(input.logPath, "utf-8");
    telemetryData = parseFlightLog(content);
    await createTelemetryEntries(prisma, flight.id, telemetryData);

    // 비디오 세그먼트 분석
    videoSegments = findVideoSegments(telemetryData);
    console.log(`발견된 비디오 구간: ${videoSegments.length}개`);
    videoSegments.forEach((segment, index) => {
      console.log(
        `구간 ${index + 1}: ${segment.startTime}ms ~ ${segment.endTime}ms (${
          segment.duration
        }ms)`
      );
    });
  }

  // 3. Process videos and tracking data if available
  if (input.videoPaths?.length && input.trackingPaths?.length) {
    // 비디오 파일과 세그먼트 매핑
    const videoMapping = mapVideosToSegments(videoSegments, input.videoPaths);

    // 각 비디오와 트래킹 데이터 처리
    for (let i = 0; i < input.videoPaths.length; i++) {
      const videoPath = input.videoPaths[i];
      const trackingPath = input.trackingPaths[i];
      const segment = videoMapping.get(videoPath);

      if (!segment) {
        throw new Error(
          `비디오 파일 ${videoPath}에 대한 세그먼트 매핑을 찾을 수 없습니다.`
        );
      }

      const trackingContent = await fs.readFile(trackingPath, "utf-8");
      const { metadata, results } = parseTrackingData(trackingContent);

      const video = await createVideo(prisma, flight.id, metadata, videoPath);

      // 해당 세그먼트의 텔레메트리 데이터만 추출
      const segmentTelemetry = telemetryData.slice(
        segment.startIndex,
        segment.endIndex + 1
      );

      // 메트릭 계산을 위해 비디오 메타데이터와 카메라 FOV 전달
      await saveTrackingResults(
        prisma,
        video.id,
        results,
        segmentTelemetry,
        metadata, // 비디오 메타데이터 추가
        metadata.fps,
        cameraFov // 카메라 FOV 추가
      );

      console.log(
        `비디오 ${i + 1}/${input.videoPaths.length} 처리 완료 ` +
          `(${path.basename(videoPath)})`
      );
    }
  }

  return flight;
}
