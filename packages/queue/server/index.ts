import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import Job from "../lib/job"
import Queue from "../lib/queue"
import Task from "../lib/task"
import { queueCaptureParamsSchema } from "../lib/types"

const app = new Hono()
app.use("/*", cors())
app.use("/*", timeout(1000 * 60 * 1)) // 1 minutes

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

    // create jobs
    const jobs = await Job.createByTask(task)

    // add jobs to queue
    await Promise.all(jobs.map((job) => Queue.add(job)))

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
