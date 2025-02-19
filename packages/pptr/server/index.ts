import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { captureParamsSchema, d } from "@pptr/core"
import { config as configDotenv } from "dotenv"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import { launch } from "../lib/browser"
import logger from "../lib/logger"
import { capturePage, initPage } from "../lib/page"

configDotenv()

const app = new Hono()
app.use("/*", cors())
app.use("/*", timeout(d("5 mins")))

app.get("/", (c) => {
  return c.json({
    message: "Hello, world!",
  })
})

app.post("/capture", validate("json", captureParamsSchema), async (c) => {
  const params = c.req.valid("json")
  const requestId = c.req.header("request-id")

  logger.info("/capture", {
    requestId,
    params,
  })

  let closeBrowser: () => Promise<void> = async () => {}

  try {
    const startTime = Date.now()

    const { context, close } = await launch()
    closeBrowser = close

    const page = initPage(await context.newPage(), params)
    await page.goto(params.url, { waitUntil: "networkidle0" })
    const data = await capturePage(page, params)

    const duration = Date.now() - startTime
    logger.info("/capture success", {
      requestId,
      duration,
    })

    const headers: any = {
      "content-type": data.contentType,
      "content-disposition": `attachment; filename=capture.${params.captureFormat}`,
      duration: `${duration}`,
    }
    if (requestId) {
      headers["request-id"] = requestId
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
    await closeBrowser()
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
