import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { captureParamsSchema, d } from "@pptr/core"
import { config as configDotenv } from "dotenv"
import { Hono } from "hono"
import { timeout } from "hono/timeout"
import { BrowserInstance } from "../lib/browser"
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

  let shouldDestroyBrowser: BrowserInstance | null = null

  console.log(
    "size",
    pool.size,
    "available",
    pool.available,
    "borrowed",
    pool.borrowed,
    "pending",
    pool.pending,
  )

  try {
    const startTime = Date.now()

    const browser = await pool.acquire()
    shouldDestroyBrowser = browser

    const page = initPage(await browser.context.newPage(), params)
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
    if (shouldDestroyBrowser) {
      pool.destroy(shouldDestroyBrowser)
    }
  }
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

async function shutdown() {
  console.log("Shutting down...")
  await pool.drain()
  await pool.clear()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
