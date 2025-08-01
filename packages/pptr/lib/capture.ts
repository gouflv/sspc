import { CaptureParamsType, d } from "@sspc/core"
import { isNumber } from "lodash-es"
import { Page, PDFOptions, ScreenshotOptions } from "puppeteer-core"

export type CaptureResult = {
  contentType: string
  raw: Uint8Array
}

export async function capturePage(page: Page, params: CaptureParamsType) {
  if (params.captureFormat === "pdf") {
    return capturePDF(page, params)
  } else {
    return captureImage(page, params)
  }
}

async function capturePDF(
  page: Page,
  params: CaptureParamsType,
): Promise<CaptureResult> {
  const options: PDFOptions = {
    format: params.pdfFormat as any,
    margin: params.pdfMargin,
    printBackground: true,
    timeout: d("60 s"),
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

async function captureImage(
  page: Page,
  params: CaptureParamsType,
): Promise<CaptureResult> {
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
