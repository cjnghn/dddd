// src/core/flight/services/flight-processor.ts
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import { Result, err, ok } from "neverthrow";

import { ProcessingError } from "../../../common/errors/domain-error";
import { logger } from "../../../infrastructure/logging/logger";
import {
  TrackingMetadata,
  TrackingResult,
} from "../../object/domain/tracking-result";
import { TrackingParser } from "../../object/services/tracking-parser";
import { TelemetryParser } from "../../telemetry/services/telemetry-parser";
import { VideoMetadata } from "../../video/domain/video";
import { FlightSession } from "../domain/flight";
import { SessionValidator } from "./session-validator";

export class FlightProcessor {
  constructor(private prisma: PrismaClient) {}

  async processSession(
    session: FlightSession,
  ): Promise<Result<number, ProcessingError>> {
    try {
      logger.info("Starting flight session processing", {
        name: session.metadata.name,
      });

      // 세션 유효성 검증
      const validationResult = await SessionValidator.validateSession(session);
      if (validationResult.isErr()) {
        return err(
          new ProcessingError(
            `Session validation failed: ${validationResult.error.message}`,
          ),
        );
      }

      // Flight 레코드 생성
      const flight = await this.prisma.flight.create({
        data: {
          name: session.metadata.name,
          date: session.metadata.date,
          description: session.metadata.description,
          flightLog: session.logPath ?? "",
        },
      });

      // 로그 파일이 있는 경우 처리
      if (session.logPath) {
        const logResult = await this.processFlightLog(flight.id, session);

        if (logResult.isErr()) {
          return err(logResult.error);
        }
      }

      // 비디오와 트래킹 데이터 처리
      const videoResult = await this.processVideos(flight.id, session);
      if (videoResult.isErr()) {
        return err(videoResult.error);
      }

      logger.info("Flight session processing completed", {
        flightId: flight.id,
      });

      return ok(flight.id);
    } catch (error) {
      logger.error("Flight processing failed", { error });
      return err(
        new ProcessingError(
          `Flight processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  private async processFlightLog(
    flightId: number,
    session: FlightSession,
  ): Promise<Result<void, ProcessingError>> {
    try {
      const content = await fs.readFile(session.logPath!, "utf-8");
      const parseResult = TelemetryParser.parse(content);

      if (parseResult.isErr()) {
        return err(
          new ProcessingError(
            `Failed to parse flight log: ${parseResult.error.message}`,
          ),
        );
      }

      const telemetryData = parseResult.value;

      await this.prisma.telemetry.createMany({
        data: telemetryData.map((entry) => ({
          flightId,
          timeFromStartMS: entry.timeFromStart,
          latitude: entry.latitude,
          longitude: entry.longitude,
          altitude: entry.altitude,
          heading: entry.heading,
          isVideo: entry.isVideo,
        })),
      });

      return ok(undefined);
    } catch (error) {
      return err(
        new ProcessingError(
          `Failed to process flight log: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  private async processVideos(
    flightId: number,
    session: FlightSession,
  ): Promise<Result<void, ProcessingError>> {
    try {
      const processingPromises = session.videos.map(async (video, index) => {
        const trackingPath = session.trackingPaths[index];

        // 트래킹 데이터 파싱
        const trackingContent = await fs.readFile(trackingPath, "utf-8");
        const trackingResult = TrackingParser.parse(trackingContent);

        if (trackingResult.isErr()) {
          throw trackingResult.error;
        }

        // 비디오 레코드 생성
        const videoRecord = await this.prisma.video.create({
          data: {
            flightId,
            name: video.metadata.name,
            width: video.metadata.width,
            height: video.metadata.height,
            fps: video.metadata.fps,
            totalFrames: video.metadata.totalFrames,
            filePath: video.path,
          },
        });

        // 프레임 및 객체 데이터 생성/저장
        const frameResult = await this.processVideoFrames(
          videoRecord.id,
          video.metadata,
          trackingResult.value,
        );

        if (frameResult.isErr()) {
          throw frameResult.error;
        }
      });

      await Promise.all(processingPromises);
      return ok(undefined);
    } catch (error) {
      return err(
        new ProcessingError(
          `Failed to process videos: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  private async processVideoFrames(
    videoId: number,
    metadata: VideoMetadata,
    trackingData: {
      metadata: TrackingMetadata;
      results: TrackingResult[];
    },
  ): Promise<Result<void, ProcessingError>> {
    try {
      const framePromises = trackingData.results.map(async (tracking) => {
        // 프레임 생성
        const frame = await this.prisma.frame.create({
          data: {
            videoId,
            frameIndex: tracking.frameIndex,
            timestamp: new Date(), // TODO: 실제 타임스탬프 계산
          },
        });

        // 객체 데이터 생성
        if (tracking.objects.length > 0) {
          const objectsData = tracking.objects.map((obj) => ({
            videoId,
            frameId: frame.id,
            tid: obj.trackingId,
            bbox: JSON.stringify([
              obj.boundingBox.x1,
              obj.boundingBox.y1,
              obj.boundingBox.x2,
              obj.boundingBox.y2,
            ]),
            conf: obj.confidence,
            cid: obj.classId,
          }));

          await this.prisma.object.createMany({
            data: objectsData,
          });
        }
      });

      await Promise.all(framePromises);
      return ok(undefined);
    } catch (error) {
      return err(
        new ProcessingError(
          `Failed to process video frames: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }
}
