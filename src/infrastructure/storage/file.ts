// src/infrastructure/storage/file.ts
import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../../config/logger";
import { CONSTANTS } from "../../config/constants";

export async function ensureUploadDirectories() {
  try {
    for (const dir of Object.values(CONSTANTS.UPLOAD_DIRS)) {
      await fs.mkdir(dir, { recursive: true });
    }
    logger.info("Upload directories created successfully");
  } catch (error) {
    logger.error("Failed to create upload directories:", error);
    throw error;
  }
}

export async function saveUploadedFile(
  file: Express.Multer.File,
  type: keyof typeof CONSTANTS.UPLOAD_DIRS
): Promise<string> {
  const uploadDir = CONSTANTS.UPLOAD_DIRS[type];
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadDir, fileName);

  try {
    await fs.writeFile(filePath, file.buffer);
    logger.info(`File saved successfully: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error(`Failed to save file ${fileName}:`, error);
    throw error;
  }
}
