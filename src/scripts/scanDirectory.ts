// src/scripts/scanDirectory.ts
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const DirectorySchema = z.object({
  flightLog: z.string().endsWith(".csv"),
  videos: z.array(
    z.object({
      videoFile: z.string().endsWith(".MP4"),
      trackingFile: z.string().endsWith(".json"),
      nmsFile: z.string().endsWith("_nms.json"),
    })
  ),
});

export type FlightDataMapping = z.infer<typeof DirectorySchema>;

/**
 * DJI_0268.MP4 형식의 파일명에서 숫자 부분 추출
 */
function extractVideoNumber(filename: string): string | null {
  const match = filename.match(/DJI_(\d+)\.MP4$/);
  return match ? match[1] : null;
}

export function scanDirectory(directory: string): FlightDataMapping[] {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  // 플라이트 로그 찾기
  const flightLogs = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".csv"));

  if (flightLogs.length === 0) {
    throw new Error(`No flight logs found in ${directory}`);
  }

  const mappings: FlightDataMapping[] = [];

  for (const flightLog of flightLogs) {
    const files = fs.readdirSync(directory);

    // 비디오 파일 찾기 (DJI_*.MP4)
    const videoFiles = files.filter((file) => file.match(/^DJI_\d+\.MP4$/));

    const videos = videoFiles.map((videoFile) => {
      const videoNumber = extractVideoNumber(videoFile);
      if (!videoNumber) {
        throw new Error(`Invalid video filename format: ${videoFile}`);
      }

      // 트래킹 파일 찾기 (bytetrack_yolov11s_*.json)
      const trackingFile = files.find(
        (file) =>
          file.startsWith("bytetrack_yolov11s_") &&
          file.includes(`DJI_${videoNumber}`) &&
          file.endsWith(".json")
      );

      // NMS 파일 찾기 (yolov11s_*_nms.json)
      const nmsFile = files.find(
        (file) =>
          file.startsWith("yolov11s_") &&
          file.includes(`DJI_${videoNumber}`) &&
          file.endsWith("_nms.json")
      );

      if (!trackingFile || !nmsFile) {
        throw new Error(
          `Missing tracking or NMS file for video ${videoFile}\n` +
            `Expected pattern: bytetrack_yolov11s_*_DJI_${videoNumber}.json\n` +
            `and yolov11s_*_DJI_${videoNumber}_nms.json`
        );
      }

      return {
        videoFile: path.join(directory, videoFile),
        trackingFile: path.join(directory, trackingFile),
        nmsFile: path.join(directory, nmsFile),
      };
    });

    try {
      const mapping = DirectorySchema.parse({
        flightLog: path.join(directory, flightLog),
        videos,
      });

      mappings.push(mapping);
    } catch (error) {
      console.error(`Invalid directory structure for ${flightLog}:`, error);
    }
  }

  if (mappings.length === 0) {
    throw new Error("No valid flight data found");
  }

  return mappings;
}

// 디버깅을 위한 테스트 코드
if (require.main === module) {
  try {
    const mappings = scanDirectory("./data");
    console.log("Found flight data:");
    mappings.forEach((mapping, index) => {
      console.log(`\nFlight ${index + 1}:`);
      console.log(`Log: ${path.basename(mapping.flightLog)}`);
      mapping.videos.forEach((video, vIndex) => {
        console.log(`\nVideo ${vIndex + 1}:`);
        console.log(`Video: ${path.basename(video.videoFile)}`);
        console.log(`Tracking: ${path.basename(video.trackingFile)}`);
        console.log(`NMS: ${path.basename(video.nmsFile)}`);
      });
    });
  } catch (error) {
    console.error("Error scanning directory:", error);
    process.exit(1);
  }
}

/*
예상되는 디렉토리 구조:
data/
  flight_log.csv
  DJI_0268.MP4
  bytetrack_yolov11s_v4_2560_b8_e60_DJI_0268.json
  yolov11s_v4_2560_b8_e60_DJI_0268_nms.json
  DJI_0269.MP4
  bytetrack_yolov11s_v4_2560_b8_e60_DJI_0269.json
  yolov11s_v4_2560_b8_e60_DJI_0269_nms.json
  ...
*/
