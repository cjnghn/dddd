// src/scripts/cli.ts
import { Command } from "commander";
import { processFlightCommand } from "./commands/process-flight";

const program = new Command();

program.name("drone-data").description("드론 데이터 처리 CLI").version("1.0.0");

program.addCommand(processFlightCommand);

program.parse();
