import { parseInt } from "lodash-es"

export type EnvSchema = {
  NODE_ENV: "development" | "production" | "test"
  PORT: number
  LOG_LEVEL: string
  PUPPETEER_TIMEOUT: number
  PUPPETEER_CACHE_DIR: string
  PUPPETEER_CHROME_REVISION: string
  PUPPETEER_EXECUTABLE_PATH: string
  POOL_SIZE_MAX: number
  POOL_SIZE_MIN: number
}

const schema: Record<keyof EnvSchema, string> = {
  NODE_ENV: "string",
  PORT: "number",
  LOG_LEVEL: "string",
  PUPPETEER_TIMEOUT: "number",
  PUPPETEER_CACHE_DIR: "string",
  PUPPETEER_CHROME_REVISION: "string",
  PUPPETEER_EXECUTABLE_PATH: "string",
  POOL_SIZE_MAX: "number",
  POOL_SIZE_MIN: "number",
}

export function getEnv<K extends keyof EnvSchema>(
  name: K,
): EnvSchema[K] | undefined {
  const value = process.env[name] as string | undefined

  if (value === undefined) {
    return undefined
  }

  switch (schema[name]) {
    case "number":
      return parseInt(value, 10) as EnvSchema[K]
    case "string":
      return value as EnvSchema[K]
    default:
      return undefined
  }
}
