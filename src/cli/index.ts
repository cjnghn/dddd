/**
pnpm run cli process-flight \
  --name "테스트 비행" \
  --date "2024-11-20" \
  --description "테스트 설명" \
  --log "../2024-11-19/Nov-19th-2024-02-27PM-Flight-Airdata.csv" \
  --videos "../2024-11-19/DJI_0279.MP4,../2024-11-19/DJI_0280.MP4" \
  --tracking "../2024-11-19/bytetrack_yolov11s_v4_2560_b8_e60_DJI_0279.json,../2024-11-19/bytetrack_yolov11s_v4_2560_b8_e60_DJI_0280.json"
 */

// src/cli/index.ts
import { Command } from "commander";
import { processFlightCommand } from "./commands/process-flight";

const program = new Command()
  .name("drone-data")
  .description("드론 데이터 처리 CLI")
  .version("1.0.0");

program.addCommand(processFlightCommand);

program.parse();
