import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { d } from "@pptr/core"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import Task from "../lib/entities/task"
import queue from "../lib/queue"
import { queueCaptureParamsSchema } from "../lib/types"

// Bull works
import logger from "../lib/utils/logger"
import "../lib/workers"

const app = new Hono()
app.use("/*", cors())
app.use("/*", timeout(d("5 mins")))

app.get("/", (c) => {
  return c.json({
    message: "Hello, world!",
  })
})

/**
 * Create a new task
 */
app.post("/task", validate("json", queueCaptureParamsSchema), async (c) => {
  const params = c.req.valid("json")

  try {
    // create task
    const task = await Task.create(params)

    const job = await queue.add(task)
    logger.debug("Task added to queue", { job })

    return c.json({
      success: true,
      data: task,
    })
  } catch (e) {
    return c.json({
      success: false,
      error: (e as Error).message,
    })
  }
})

/**
 * Get task status
 *
 * @returns TaskInfo
 */
app.get("/task/:id", (c) => {
  return c.json({
    status: "pending",
  })
})

// get artifact
app.get("/task/:id/artifact", (c) => {
  return new Response()
})

serve(
  {
    port: parseInt(process.env["PORT"] || "3001"),
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on ${info.port}`)
  },
)
