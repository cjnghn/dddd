// src/infrastructure/storage/file.ts
import fs from "fs/promises";
import path from "path";

import { CONSTANTS } from "../../common/constants";
import { logger } from "../logging/logger";

export async function ensureUploadDirectories() {
  try {
    for (const dir of Object.values(CONSTANTS.PATHS.UPLOADS)) {
      await fs.mkdir(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  } catch (error) {
    logger.error("Failed to create upload directories:", error);
    throw error;
  }
}

export async function saveFile(
  file: Express.Multer.File,
  directory: string,
): Promise<string> {
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(directory, fileName);

  try {
    await fs.writeFile(filePath, file.buffer);
    logger.debug(`Saved file: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error(`Failed to save file: ${fileName}`, error);
    throw error;
  }
}
