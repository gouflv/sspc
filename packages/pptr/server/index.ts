import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { captureParamsSchema, d } from "@sspc/core"
import { Hono } from "hono"
import { timeout } from "hono/timeout"
import { Browser } from "puppeteer-core"
import { capturePage } from "../lib/capture"
import { env } from "../lib/env"
import logger from "../lib/logger"
import { initPage, waitForImagesToLoad } from "../lib/page"
import { pool } from "../lib/pool"

const app = new Hono()

app.use("/*", timeout(d("5 mins")))

app.get("/", (c) => {
  return c.text("Hello, world!")
})

app.post("/capture", validate("json", captureParamsSchema), async (c) => {
  const params = c.req.valid("json")
  const requestId = c.req.header("request-id")

  logger.info("/capture", {
    requestId,
    params,
  })

  let browser: Browser | null = null

  try {
    const metrics = {
      start: Date.now(),
      browserStart: 0,
      browserInit: 0,
      pageLoadStart: 0,
      pageLoadEnd: 0,
      captureStart: 0,
      captureEnd: 0,
      pdfCompressStart: 0,
      pdfCompressEnd: 0,
      end: 0,
    }

    metrics.browserStart = Date.now()

    // ================================
    // Initialize the browser page
    // ================================
    const _browser = await pool.acquire()
    browser = _browser

    const context = await _browser.createBrowserContext()
    const page = await context.newPage()

    initPage(page, params)

    metrics.browserInit = Date.now()

    // ================================
    // Navigate to the URL
    // ================================
    metrics.pageLoadStart = Date.now()
    await page.goto(params.url, { waitUntil: "networkidle0" })
    if (params.readySelector) {
      await page.waitForSelector(params.readySelector)
    }
    await waitForImagesToLoad(page)

    metrics.pageLoadEnd = Date.now()

    // ================================
    // Capture the page
    // ================================
    metrics.captureStart = Date.now()
    let captureResult = await capturePage(page, params)
    metrics.captureEnd = Date.now()

    // ================================
    // Log and respond
    // ================================
    metrics.end = Date.now()

    const duration = {
      browserInit: metrics.browserInit - metrics.browserStart,
      pageLoad: metrics.pageLoadEnd - metrics.pageLoadStart,
      capture: metrics.captureEnd - metrics.captureStart,
      pdfCompress: metrics.pdfCompressEnd - metrics.pdfCompressStart,
      total: metrics.end - metrics.start,
    }

    logger.info("/capture success", {
      requestId,
      duration,
    })

    const headers: any = {
      "content-type": captureResult.contentType,
      duration: `${duration.total}`,
      ...(requestId ? { "request-id": requestId } : {}),
    }

    return new Response(captureResult.raw.buffer as ArrayBuffer, { headers })
  } catch (e) {
    const error = e as Error
    logger.error("/capture", {
      requestId,
      error,
    })
    return c.json(
      {
        success: false,
        error: error.message,
      },
      500,
    )
  } finally {
    if (browser) {
      pool.destroy(browser)
    }
  }
})

app.get("/pool-status", async (c) => {
  const status = {
    size: pool.size,
    available: pool.available,
    borrowed: pool.borrowed,
    pending: pool.pending,
  }
  return c.json(status)
})

serve(
  {
    port: env.PORT,
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on ${info.port}`)
  },
)

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing...\n`)
  await pool.drain()
  await pool.clear()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
