import { d, type CaptureParamsType } from "@sspc/core"
import { isNumber } from "lodash-es"
import type { Page } from "puppeteer-core"
import { env } from "./env"

export function initPage(page: Page, params: CaptureParamsType) {
  if (isNumber(params.viewportWidth) && isNumber(params.viewportHeight)) {
    page.setViewport({
      width: params.viewportWidth,
      height: params.viewportHeight,
    })
  }

  const timeout =
    (params.timeout && Math.min(params.timeout, d("5 mins"))) ??
    env.PUPPETEER_TIMEOUT

  page.setDefaultTimeout(timeout)
  page.setDefaultNavigationTimeout(timeout)

  return page
}

export async function waitForImagesToLoad(page: Page, timeout?: number) {
  await page.waitForFunction(
    () => {
      const images = Array.from(document.images)
      return images.every((img) => img.complete)
    },
    { timeout: timeout ?? page.getDefaultTimeout() },
  )
}
