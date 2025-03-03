import type { CaptureParamsType } from "@pptr/core"
import { isNumber } from "lodash-es"
import type { Page, PDFOptions, ScreenshotOptions } from "puppeteer-core"

export function initPage(page: Page, params: CaptureParamsType) {
  if (isNumber(params.viewportWidth) && isNumber(params.viewportHeight)) {
    page.setViewport({
      width: params.viewportWidth,
      height: params.viewportHeight,
    })
  }

  page.setDefaultTimeout(
    params.timeout ??
      (parseInt(process.env["PUPPETEER_TIMEOUT"] || "") || 30_000),
  )

  return page
}

export async function capturePage(page: Page, params: CaptureParamsType) {
  if (params.captureFormat === "pdf") {
    return capturePDF(page, params)
  } else {
    return captureImage(page, params)
  }
}

async function capturePDF(page: Page, params: CaptureParamsType) {
  const options: PDFOptions = {
    format: params.pdfFormat as any,
    margin: params.pdfMargin,
    printBackground: true,
  }
  if (isNumber(params.pdfWidth) && isNumber(params.pdfHeight)) {
    options.width = params.pdfWidth
    options.height = params.pdfHeight
  }
  const raw = await page.pdf(options)
  return {
    contentType: "application/pdf",
    raw,
  }
}

async function captureImage(page: Page, params: CaptureParamsType) {
  const captureFormat = params.captureFormat || "png"

  const options: ScreenshotOptions = {
    type: captureFormat as any,
    quality: params.captureFormat === "jpeg" ? params.quality : undefined,
  }

  const contentType = `image/${captureFormat}`

  if (params.captureElementSelector) {
    const el = await page.waitForSelector(params.captureElementSelector)
    const raw = await el!.screenshot(options)
    return { contentType, raw }
  } else {
    const raw = await page.screenshot({
      ...options,
      fullPage: true,
    })
    return { contentType, raw }
  }
}
