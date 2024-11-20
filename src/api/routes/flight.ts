// src/api/routes/flight.ts
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { logger } from "../../config/logger";
import { CONSTANTS } from "../../config/constants";
import { FlightDataProcessor } from "../../domain/flight/services/processor";
import { ensureUploadDirectories } from "../../infrastructure/storage/file";

const router = Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureUploadDirectories();

      let uploadDir = CONSTANTS.UPLOAD_DIRS.LOGS;
      if (file.fieldname === "videos") {
        uploadDir = CONSTANTS.UPLOAD_DIRS.VIDEOS;
      } else if (file.fieldname === "tracking") {
        uploadDir = CONSTANTS.UPLOAD_DIRS.TRACKING;
      }

      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const requestSchema = z.object({
  name: z.string(),
  date: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
  cameraFov: z.number().optional(),
});

router.post(
  "/process",
  upload.fields([
    { name: "log", maxCount: 1 },
    { name: "videos", maxCount: 10 },
    { name: "tracking", maxCount: 10 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const input = requestSchema.parse({
        name: req.body.name,
        date: req.body.date,
        description: req.body.description,
        cameraFov: req.body.cameraFov
          ? parseFloat(req.body.cameraFov)
          : undefined,
      });

      const processor = FlightDataProcessor.create(req.app.locals.prisma);

      const result = await processor.processFlightData({
        ...input,
        logPath: files.log?.[0]?.path,
        videoPaths: files.videos?.map((f) => f.path),
        trackingPaths: files.tracking?.map((f) => f.path),
      });

      logger.info("API: Flight processing completed", { flightId: result.id });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
