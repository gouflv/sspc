import { d, type CaptureParamsType } from "@pptr/core"
import { isNumber } from "lodash-es"
import type { Page } from "puppeteer-core"
import { getEnv } from "./env"

export function initPage(page: Page, params: CaptureParamsType) {
  if (isNumber(params.viewportWidth) && isNumber(params.viewportHeight)) {
    page.setViewport({
      width: params.viewportWidth,
      height: params.viewportHeight,
    })
  }

  const timeout =
    (params.timeout && Math.min(params.timeout, d("5 mins"))) ??
    getEnv("PUPPETEER_TIMEOUT") ??
    30_000
  page.setDefaultTimeout(timeout)
  page.setDefaultNavigationTimeout(timeout)

  return page
}
