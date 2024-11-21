// src/infrastructure/config/environment.ts
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().transform(Number).default("3000"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_SIZE: z
    .string()
    .transform((str) => parseInt(str) * 1024 * 1024)
    .default("100"), // 100MB
});

export const env = envSchema.parse(process.env);
