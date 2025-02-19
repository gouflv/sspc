import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { Hono } from "hono"
import mime from "mime"
import Task from "../lib/entities/task"
import Queue from "../lib/queue"
import { queueCaptureParamsSchema } from "../lib/types"
import Artifact from "../lib/utils/artifact"

// Bull works
import { getTaskInfo } from "../lib/utils/helper"
import "../lib/workers"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello, world!")
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
 * Get task info
 */
app.get("/task/:id", async (c) => {
  const taskId = c.req.param("id")

  try {
    const info = await getTaskInfo(taskId)
    return c.json({
      success: true,
      data: info,
    })
  } catch (e) {
    return c.json({
      success: false,
      error: (e as Error).message,
    })
  }
})

// get artifact
app.get("/task/:id/artifact", async (c) => {
  const taskId = c.req.param("id")
  try {
    const task = await Task.findById(taskId)

    if (!task) {
      throw new Error("task not found")
    }
    if (!task.artifact) {
      throw new Error("artifact not found")
    }

    const stream = await Artifact.geReadStream(task?.artifact)

    return new Response(stream, {
      headers: {
        "content-type": mime.getType(task.artifact) || "application/zip",
        "content-disposition": `attachment; filename="${task.artifact}"`,
      },
    })
  } catch (e) {
    const error = (e as Error).message
    return c.json({ success: false, error }, 400)
  }
})

/**
 * Stop task
 *
 * NOTE: if job in progress, it will not stop immediately
 */
app.get("/task/:id/cancel", async (c) => {
  const taskId = c.req.param("id")

  try {
    // remove task from queue
    const success = await Queue.remove(taskId)

    // update task
    await Task.update(taskId, { status: "canceled" })

    return c.json({
      success,
    })
  } catch (e) {
    return c.json({
      success: false,
      error: (e as Error).message,
    })
  }
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
