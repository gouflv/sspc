import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { d } from "@pptr/core"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import Task from "../lib/entities/task"
import Queue from "../lib/queue"
import { queueCaptureParamsSchema } from "../lib/types"
import Artifact from "../lib/utils/artifact"
import logger from "../lib/utils/logger"

// Bull works
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
    let task = await Task.create(params)

    // add task to queue
    const { job } = await Queue.add(task)
    logger.debug("Task added to queue", { job })

    // save queueJobId
    task = await Task.update(task.id, { queueJobId: job.id })

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
 */
app.get("/task/:id", (c) => {
  return c.json({
    status: "pending",
  })
})

// get artifact
app.get("/task/:id/artifact", async (c) => {
  const taskId = c.req.param("id")
  const task = await Task.findById(taskId)

  if (!task) {
    return c.json({ success: false, error: "Task not found" }, 400)
  }
  if (!task.artifact) {
    return c.json({ success: false, error: "Artifact not found" }, 400)
  }

  const stream = await Artifact.geReadStream(task?.artifact)

  return new Response(stream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${task.artifact}"`,
    },
  })
})

/**
 * Stop task
 *
 * NOTE: if job in progress, it will not stop immediately
 */
app.get("/task/:id/cancel", async (c) => {
  const taskId = c.req.param("id")

  // remove task from queue
  const success = await Queue.remove(taskId)

  return c.json({
    success,
  })
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
