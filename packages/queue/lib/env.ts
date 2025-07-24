import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  /**
   * Capture task expiration time in seconds.
   * Default is 7 days
   */
  TASK_EXPIRE: z.coerce
    .number()
    .int()
    .positive()
    .default(
      process.env.NODE_ENV === "development"
        ? 10 * 60 // 10 mins
        : 7 * 24 * 60 * 60, // 7 days
    ),

  /**
   * Queue job attempts.
   * Default is 2
   */
  JOB_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(process.env.NODE_ENV === "production" ? 2 : 0),

  /**
   * Capture service endpoint.
   */
  CAPTURE_ENDPOINT: z.string().url().default("http://localhost:3000/capture"),

  /**
   * Concurrency for capture worker.
   * Default is 4
   */
  CAPTURE_CONCURRENCY: z.coerce.number().int().positive().default(4),

  /**
   * Concurrency for compress worker.
   */
  COMPRESS_CONCURRENCY: z.coerce.number().int().positive().default(2),
})

const parseResult = envSchema.safeParse(process.env)
if (!parseResult.success) {
  console.error("Environment validation failed:", parseResult.error.message)
  process.exit(1)
}

export const env = parseResult.data

console.log("Environment variables:", env)
