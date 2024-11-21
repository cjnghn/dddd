// src/core/object/services/tracking-parser.ts
import { err, ok } from "neverthrow";
import { z } from "zod";

import { ValidationError } from "../../../common/errors/domain-error";
import { logger } from "../../../infrastructure/logging/logger";

const boundingBoxSchema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .transform((coords) => ({
    x1: coords[0],
    y1: coords[1],
    x2: coords[2],
    y2: coords[3],
  }));

export class TrackingParser {
  static parse(content: string) {
    try {
      logger.debug("Parsing tracking file");

      const data = JSON.parse(content);
      const validationResult = this.validateTrackingData(data);

      if (validationResult.isErr()) {
        return validationResult;
      }

      const { model, tracker, results } = validationResult.value;

      logger.debug("Tracking file parsed successfully", {
        modelName: model.name,
        resultCount: results.length,
      });

      return ok({
        metadata: { model, tracker },
        results,
      });
    } catch (error) {
      logger.error("Failed to parse tracking file", { error });
      return err(
        new ValidationError(
          `Failed to parse tracking file: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  private static validateTrackingData(data: unknown) {
    try {
      const schema = z.object({
        model: z.object({
          name: z.string(),
          confidence_threshold: z.number(),
          nms: z.boolean(),
        }),
        tracker: z.object({
          name: z.string(),
        }),
        tracking_results: z.array(
          z.object({
            i: z.number(),
            res: z.array(
              z.object({
                tid: z.number(),
                bbox: boundingBoxSchema,
                conf: z.number(),
                cid: z.number(),
              }),
            ),
          }),
        ),
      });

      const parsed = schema.parse(data);

      return ok({
        model: {
          name: parsed.model.name,
          confidenceThreshold: parsed.model.confidence_threshold,
          nms: parsed.model.nms,
        },
        tracker: parsed.tracker,
        results: parsed.tracking_results.map((result) => ({
          frameIndex: result.i,
          objects: result.res.map((obj) => ({
            trackingId: obj.tid,
            boundingBox: obj.bbox,
            confidence: obj.conf,
            classId: obj.cid,
          })),
        })),
      });
    } catch (error) {
      return err(
        new ValidationError(
          `Invalid tracking data format: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }
}
