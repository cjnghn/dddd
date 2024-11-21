// src/core/flight/services/session-validator.ts
import { Result, err, ok } from "neverthrow";

import { ValidationError } from "../../../common/errors/domain-error";
import { logger } from "../../../infrastructure/logging/logger";
import { FlightSession } from "../domain/flight";

export class SessionValidator {
  static validateSession(
    session: FlightSession,
  ): Result<true, ValidationError> {
    try {
      // 1. 기본 메타데이터 검증
      if (!session.metadata.name || !session.metadata.date) {
        return err(
          new ValidationError("Missing required metadata: name or date"),
        );
      }

      // 2. 비디오와 트래킹 파일 수 일치 확인
      if (session.videos.length !== session.trackingPaths.length) {
        return err(
          new ValidationError(
            `Mismatch between number of videos (${session.videos.length}) and ` +
              `tracking files (${session.trackingPaths.length})`,
          ),
        );
      }

      // 3. 비디오 메타데이터 검증
      const videoValidation = this.validateVideoMetadata(session);
      if (videoValidation.isErr()) {
        return videoValidation;
      }

      logger.debug("Session validation passed", {
        name: session.metadata.name,
        videoCount: session.videos.length,
      });

      return ok(true);
    } catch (error) {
      logger.error("Session validation failed", { error });
      return err(
        new ValidationError(
          `Session validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  private static validateVideoMetadata(
    session: FlightSession,
  ): Result<true, ValidationError> {
    for (const video of session.videos) {
      const { metadata } = video;

      if (
        !metadata.width ||
        !metadata.height ||
        !metadata.fps ||
        !metadata.totalFrames
      ) {
        return err(
          new ValidationError(`Invalid video metadata for ${video.path}`),
        );
      }

      if (metadata.fps <= 0 || metadata.totalFrames <= 0) {
        return err(
          new ValidationError(`Invalid video parameters for ${video.path}`),
        );
      }
    }

    return ok(true);
  }
}
