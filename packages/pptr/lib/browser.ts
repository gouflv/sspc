import {
  Browser as BrowserType,
  computeExecutablePath,
  resolveBuildId,
} from "@puppeteer/browsers"
import { homedir } from "node:os"
import { join } from "node:path"
import pptr, { type LaunchOptions } from "puppeteer-core"
import logger from "./logger"

/**
 * Example:
 * ```ts
 * const browser = await launch()
 * const page = await browser.newPage()
 * await page.goto("https://example.com")
 *
 * // After you are done with the page
 * await browser.close()
 * ```
 */
export async function launch(options?: LaunchOptions) {
  const executablePath = await getExecutablePath()
  logger.debug("launch", { executablePath })

  return await pptr.launch({
    executablePath,
    args: [
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
    ...options,
  })
}

async function getExecutablePath() {
  const envPath = process.env["PUPPETEER_EXECUTABLE_PATH"]
  if (envPath) {
    logger.debug("getExecutablePath", { envPath })
    return envPath
  }

  const buildId = await resolveBuildId(
    BrowserType.CHROME,
    "" as any,
    process.env["PUPPETEER_CHROME_REVISION"] || "133.0.6943.53",
  )
  const path = computeExecutablePath({
    browser: "chrome" as any,
    cacheDir:
      process.env["PUPPETEER_CACHE_DIR"] || join(homedir(), ".cache/puppeteer"),
    buildId,
  })
  logger.debug("getExecutablePath", { buildId, path })
  return path
}
