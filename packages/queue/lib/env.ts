import { parseEnv, port, z } from "znv"

const schema = {
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: port().default(3001),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  /**
   * Capture task expiration time in seconds.
   * Default is 7 day
   */
  TASK_EXPIRE: z.number().default(7 * 24 * 60 * 60),

  /**
   * Queue job attempts.
   */
  JOB_ATTEMPTS: z.number().default(1),

  /**
   * Capture service endpoint.
   */
  CAPTURE_ENDPOINT: z.string().default("http://localhost:3000/capture"),

  /**
   * Concurrency for capture worker.
   * Default is 4
   */
  CAPTURE_CONCURRENCY: z.number().default(4),
}

export const env = parseEnv(process.env, schema)

console.log("Environment variables:", env)
