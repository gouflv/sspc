import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { captureParamsSchema, d } from "@pptr/core"
import { config as configDotenv } from "dotenv"
import { Hono } from "hono"
import { timeout } from "hono/timeout"
import { Browser } from "puppeteer-core"
import logger from "../lib/logger"
import { capturePage, initPage } from "../lib/page"
import { pool } from "../lib/pool"

configDotenv()

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
    const startTime = Date.now()

    const _browser = await pool.acquire()
    browser = _browser

    const context = await _browser.createBrowserContext()
    const page = await context.newPage()

    initPage(page, params)

    await page.goto(params.url, { waitUntil: "networkidle0" })

    const data = await capturePage(page, params)

    const duration = Date.now() - startTime
    logger.info("/capture success", {
      requestId,
      duration,
    })

    const headers: any = {
      "content-type": data.contentType,
      duration: `${duration}`,
      ...(requestId ? { "request-id": requestId } : {}),
    }

    return new Response(data.raw.buffer as ArrayBuffer, { headers })
  } catch (e) {
    const error = e as Error
    logger.error("/capture", {
      requestId,
      error: error.message,
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
    port: parseInt(process.env["PORT"] || "3000"),
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
