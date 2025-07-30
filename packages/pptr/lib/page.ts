import { d, type CaptureParamsType } from "@sspc/core"
import { isNumber } from "lodash-es"
import type { Page } from "puppeteer-core"
import UserAgents from "user-agents"
import { env } from "./env"

export function initPage(page: Page, params: CaptureParamsType) {
  if (isNumber(params.viewport?.width) && isNumber(params.viewport?.height)) {
    page.setViewport({
      width: params.viewport.width,
      height: params.viewport.height,
    })
  }

  if (params.headers) page.setExtraHTTPHeaders(params.headers)

  if (params.cookies) page.browserContext().setCookie(...params.cookies)

  if (params.userAgent) {
    if (typeof params.userAgent === "string") {
      page.setUserAgent(params.userAgent)
    } else {
      page.setUserAgent(new UserAgents(params.userAgent).toString())
    }
  }

  const timeout =
    typeof params.timeout === "number"
      ? Math.min(params.timeout, d("5 mins"))
      : env.PUPPETEER_TIMEOUT
  page.setDefaultTimeout(timeout)
  page.setDefaultNavigationTimeout(timeout)

  return page
}

export async function waitForImagesToLoad(page: Page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.images)
    return images.every((img) => img.complete)
  })
}
