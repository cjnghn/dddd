// src/config/environment.ts
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string(),
  PORT: z.string().transform(Number).default("3000"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  UPLOAD_DIR: z.string().default("./uploads"),
});

export const env = envSchema.parse(process.env);
