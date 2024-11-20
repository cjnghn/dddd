// src/cli/commands/process-flight.ts
import { Command } from "commander";
import path from "node:path";
import { z } from "zod";
import { logger } from "../../config/logger";
import { createPrismaClient } from "../../infrastructure/database/prisma";
import { FlightDataProcessor } from "../../domain/flight/services/processor";
import { findVideoSegments } from "../../domain/flight/analysis/segment";
import { parseFlightLog } from "../../domain/flight/analysis/parsers";
import fs from "node:fs/promises";

const inputSchema = z.object({
  name: z.string(),
  date: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
  logPath: z.string().optional(),
  videoPaths: z.array(z.string()).optional(),
  trackingPaths: z.array(z.string()).optional(),
  cameraFov: z.number().optional(),
});

/**
 * 파일 경로가 유효한지 확인
 */
async function validateFilePath(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
  }
}

/**
 * 쉼표로 구분된 경로 문자열을 배열로 변환
 */
function parsePathList(value: string): string[] {
  return value.split(",").map((p) => p.trim());
}

export const processFlightCommand = new Command("process-flight")
  .description("드론 비행 데이터를 처리하여 DB에 저장합니다")
  .requiredOption("--name <name>", "비행 이름")
  .requiredOption("--date <date>", "비행 날짜 (YYYY-MM-DD)")
  .option("--description <text>", "비행 설명")
  .option("--log <path>", "비행 로그 CSV 파일 경로")
  .option("--videos <paths>", "비디오 파일 경로들 (쉼표로 구분)", parsePathList)
  .option(
    "--tracking <paths>",
    "트래킹 결과 JSON 파일 경로들 (쉼표로 구분)",
    parsePathList
  )
  .option(
    "--camera-fov <degrees>",
    "카메라 FOV (기본값: 84도)",
    Number.parseFloat,
    84
  )
  .action(async (options) => {
    const prisma = createPrismaClient();

    try {
      // 파일 경로들을 절대 경로로 변환하고 존재 여부 확인
      const resolvedPaths = {
        logPath: options.log ? path.resolve(options.log) : undefined,
        videoPaths: options.videos?.map((p: string) => path.resolve(p)),
        trackingPaths: options.tracking?.map((p: string) => path.resolve(p)),
      };

      // 파일 존재 여부 확인
      if (resolvedPaths.logPath) await validateFilePath(resolvedPaths.logPath);
      if (resolvedPaths.videoPaths)
        await Promise.all(resolvedPaths.videoPaths.map(validateFilePath));
      if (resolvedPaths.trackingPaths)
        await Promise.all(resolvedPaths.trackingPaths.map(validateFilePath));

      // 비디오 구간 분석 (로그 파일이 있는 경우)
      if (resolvedPaths.logPath) {
        const content = await fs.readFile(resolvedPaths.logPath, "utf-8");
        const logEntries = parseFlightLog(content);
        const segments = findVideoSegments(logEntries);

        logger.info("=== 비디오 구간 분석 ===");
        logger.info(`발견된 비디오 구간: ${segments.length}개`);
        segments.forEach((segment, index) => {
          const duration = segment.duration / 1000; // ms to seconds
          logger.info(
            `구간 ${index + 1}: ` +
              `${segment.startTime / 1000}초 ~ ${segment.endTime / 1000}초 ` +
              `(${duration.toFixed(1)}초)`
          );
        });

        // 비디오/트래킹 파일 수 검증
        if (resolvedPaths.videoPaths?.length !== segments.length) {
          throw new Error(
            `비디오 파일 수(${resolvedPaths.videoPaths?.length || 0})가 ` +
              `로그의 비디오 구간 수(${segments.length})와 일치하지 않습니다.`
          );
        }

        if (
          resolvedPaths.videoPaths?.length !==
          resolvedPaths.trackingPaths?.length
        ) {
          throw new Error(
            `비디오 파일 수(${resolvedPaths.videoPaths.length})와 ` +
              `트래킹 파일 수(${
                resolvedPaths.trackingPaths?.length || 0
              })가 일치하지 않습니다.`
          );
        }
      }

      // 입력 데이터 검증
      const input = inputSchema.parse({
        name: options.name,
        date: options.date,
        description: options.description,
        ...resolvedPaths,
        cameraFov: options.cameraFov,
      });

      logger.info("데이터 처리 시작...", {
        name: input.name,
        videosCount: input.videoPaths?.length,
      });

      const processor = FlightDataProcessor.create(prisma);
      const result = await processor.processFlightData(input);

      logger.info("=== 처리 완료 ===");
      logger.info(`Flight ID: ${result.id}`);
      logger.info(`이름: ${result.name}`);
      logger.info(`날짜: ${result.date.toISOString()}`);
      if (result.description) {
        logger.info(`설명: ${result.description}`);
      }
    } catch (error) {
      logger.error(
        "처리 실패:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });
