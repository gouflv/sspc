import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { captureParamsSchema, type CaptureParamsType } from "@pptr/core"
import { to } from "await-to-js"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import capture from "../lib/capture"
import logger from "../lib/logger"

const app = new Hono()
app.use("/*", cors())
app.use("/*", timeout(1000 * 60 * 5)) // 5 minutes

app.get("/", (c) => {
  return c.json({
    message: "Hello, world!",
  })
})

app.post("/capture", validate("json", captureParamsSchema), async (c) => {
  const params = await c.req.json<CaptureParamsType>()

  const requestId = c.req.header("request-id")
  if (requestId) {
    c.res.headers.set("request-id", requestId)
  }

  logger.info("/capture", {
    requestId,
    params,
  })

  const startTime = Date.now()
  const [error, captureResult] = await to(capture(params))
  const duration = Date.now() - startTime

  if (error) {
    logger.error("/capture", {
      requestId,
      error: error.message,
    })
    return c.json({
      success: false,
      error: error.message,
    })
  }

  logger.info("/capture success", {
    requestId,
    duration,
  })

  const headers: any = {
    "request-id": requestId,
    "content-type":
      params.captureFormat === "pdf"
        ? "application/pdf"
        : params.captureFormat === "jpeg"
          ? "image/jpeg"
          : "image/png",
    "content-disposition": `attachment; filename=capture.${params.captureFormat}`,
  }

  return new Response(captureResult.data.buffer as ArrayBuffer, {
    headers,
  })
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
