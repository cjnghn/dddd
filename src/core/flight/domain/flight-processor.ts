// src/core/flight/domain/flight-processor.ts
import { ProcessingError } from "../../../common/errors/domain-error";
import { Result } from "../../../common/types/result";
import { TelemetryEntry } from "../../telemetry/domain/telemetry-entry";
import { TelemetrySegment } from "../../telemetry/domain/telemetry-segment";
import { FlightSession } from "./flight";

// 비디오 세그먼트와 텔레메트리 데이터를 처리한 결과
export interface FlightProcessingResult {
  flightId: number;
  videoSegments: TelemetrySegment[];
  telemetryData: TelemetryEntry[];
}

// 비행 세션을 처리하는 도메인

export interface FlightProcessor {
  processSession(
    session: FlightSession,
  ): Promise<Result<FlightProcessingResult, ProcessingError>>;

  validateSession(session: FlightSession): Result<true, ProcessingError>;
}
