import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  PUPPETEER_TIMEOUT: z.coerce.number().int().positive().default(30_000),

  PUPPETEER_CACHE_DIR: z.string().optional(),

  PUPPETEER_CHROME_REVISION: z.string().default("133.0.6943.53"),

  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),

  POOL_SIZE_MAX: z.coerce.number().int().positive().default(4),

  POOL_SIZE_MIN: z.coerce.number().int().positive().default(1),
})

const parseResult = envSchema.safeParse(process.env)
if (!parseResult.success) {
  console.error("Environment validation failed:", parseResult.error.format())
  process.exit(1)
}

export const env = parseResult.data

// Apply development-specific defaults
if (env.NODE_ENV === "development" && !env.PUPPETEER_EXECUTABLE_PATH) {
  env.PUPPETEER_EXECUTABLE_PATH =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
}

console.log("Environment variables:", env)
