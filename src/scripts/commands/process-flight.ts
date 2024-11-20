/**
pnpm run cli process-flight \
  --name "테스트 비행" \
  --date "2024-11-20" \
  --description "테스트 설명" \
  --log "../2024-11-19/Nov-19th-2024-02-27PM-Flight-Airdata.csv" \
  --videos "../2024-11-19/DJI_0279.MP4,../2024-11-19/DJI_0280.MP4" \
  --tracking "../2024-11-19/bytetrack_yolov11s_v4_2560_b8_e60_DJI_0279.json,../2024-11-19/bytetrack_yolov11s_v4_2560_b8_e60_DJI_0280.json"
 */

import path from "node:path";
import { Command } from "commander";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { findVideoSegments } from "../../domain/flight/analysis/segment";
import { parseFlightLog } from "../../domain/flight/parsers";
import { processFlightData } from "../../domain/flight/process";
import * as fs from "node:fs/promises";

// 스키마에 명시적으로 타입 지정
const inputSchema = z.object({
  name: z.string(),
  date: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
  logPath: z.string().optional(),
  videoPaths: z.array(z.string()).optional(),
  trackingPaths: z.array(z.string()).optional(),
});

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
  .action(async (options) => {
    try {
      // 비디오 구간 분석 (로그 파일이 있는 경우)
      if (options.log) {
        const content = await fs.readFile(path.resolve(options.log), "utf-8");
        const logEntries = parseFlightLog(content);
        const segments = findVideoSegments(logEntries);

        console.log("\n=== 비디오 구간 분석 ===");
        console.log(`발견된 비디오 구간: ${segments.length}개`);
        segments.forEach((segment, index) => {
          const duration = segment.duration / 1000; // ms to seconds
          console.log(
            `구간 ${index + 1}: ` +
              `${segment.startTime / 1000}초 ~ ${segment.endTime / 1000}초 ` +
              `(${duration.toFixed(1)}초)`
          );
        });
        console.log("");

        // 비디오/트래킹 파일 수 검증
        if (options.videos?.length !== segments.length) {
          throw new Error(
            `비디오 파일 수(${options.videos?.length || 0})가 ` +
              `로그의 비디오 구간 수(${segments.length})와 일치하지 않습니다.`
          );
        }

        if (options.videos?.length !== options.tracking?.length) {
          throw new Error(
            `비디오 파일 수(${options.videos.length})와 ` +
              `트래킹 파일 수(${
                options.tracking?.length || 0
              })가 일치하지 않습니다.`
          );
        }
      }

      // 입력값 파싱 및 검증
      const input = inputSchema.parse({
        name: options.name,
        date: options.date,
        description: options.description,
        logPath: options.log ? path.resolve(options.log) : undefined,
        videoPaths: options.videos?.map((p: string) => path.resolve(p)),
        trackingPaths: options.tracking?.map((p: string) => path.resolve(p)),
      });

      const prisma = new PrismaClient();
      try {
        console.log("데이터 처리 시작...");
        const result = await processFlightData(prisma, input as any);
        console.log("\n=== 처리 완료 ===");
        console.log(`Flight ID: ${result.id}`);
        console.log(`이름: ${result.name}`);
        console.log(`날짜: ${result.date.toISOString()}`);
        if (result.description) {
          console.log(`설명: ${result.description}`);
        }
      } finally {
        await prisma.$disconnect();
      }
    } catch (error) {
      console.error(
        "\n처리 실패:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });
