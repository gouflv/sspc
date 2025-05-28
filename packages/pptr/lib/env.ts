import { parseEnv, port, z } from "znv"

const schema = {
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

  PORT: port().default(3000),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  PUPPETEER_TIMEOUT: z.number().default(30_000),

  PUPPETEER_CACHE_DIR: z.string().optional(),

  PUPPETEER_CHROME_REVISION: z.string().default("133.0.6943.53"),

  PUPPETEER_EXECUTABLE_PATH: {
    schema: z.string().optional(),
    defaults: {
      development:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
  },

  POOL_SIZE_MAX: z.number().default(4),

  POOL_SIZE_MIN: z.number().default(1),
}

export const env = parseEnv(process.env, schema)

console.log("Environment variables:", env)
