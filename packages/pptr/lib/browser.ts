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

  try {
    const executablePath = await getExecutablePath()
    logger.debug({ executablePath })

    browser = await pptr.launch({
      executablePath,
      args: ["--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"],
      ...options,
    })

    context = await browser.createBrowserContext()
  } catch (error) {
    logger.error(error)
    await close()
    throw error
  }

  return {
    browser,
    context,
    close,
  }
}

async function getExecutablePath() {
  const envPath = process.env["PUPPETEER_EXECUTABLE_PATH"]
  if (envPath) {
    logger.debug({ envPath }, "getExecutablePath")
    return envPath
  }

  const buildId = await resolveBuildId(BrowserType.CHROME, "" as any, "133")
  const path = computeExecutablePath({
    browser: "chrome" as any,
    cacheDir: join(homedir(), ".cache/puppeteer"),
    buildId,
  })
  logger.debug({ buildId, path }, "getExecutablePath")
  return path
}
