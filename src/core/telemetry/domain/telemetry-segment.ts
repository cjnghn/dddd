// src/core/telemetry/domain/telemetry-segment.ts
import { TimeSegment } from "../../../common/types/time";
import { TelemetryEntry } from "./telemetry-entry";

// TelemetrySegment는 로그의 한 구간을 의미한다.
export interface TelemetrySegment extends TimeSegment {
  startIndex: number;
  endIndex: number;
  entries: TelemetryEntry[]; // TelemtryEntry는 로그의 한 줄을 의미한다.
}
