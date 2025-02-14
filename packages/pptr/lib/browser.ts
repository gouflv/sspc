import {
  Browser as BrowserType,
  computeExecutablePath,
  resolveBuildId,
} from "@puppeteer/browsers"
import { homedir } from "node:os"
import { join } from "node:path"
import pptr, {
  Browser,
  BrowserContext,
  type LaunchOptions,
} from "puppeteer-core"
import logger from "./logger"

export async function launch(options?: LaunchOptions) {
  let browser: Browser | null = null,
    context: BrowserContext | null = null

  const close = async () => {
    const pages = await context?.pages()
    if (pages) {
      await Promise.all(pages.map((page) => page.close()))
    }
    await context?.close()
    await browser?.close()
  }

  const executablePath = await getExecutablePath()
  logger.debug("launch", { executablePath })

  browser = await pptr.launch({
    executablePath,
    args: [
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    ...options,
  })

  context = await browser.createBrowserContext()

  return {
    browser,
    context,
    close,
  }
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
