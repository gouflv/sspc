import { serve } from "@hono/node-server"
import { zValidator as validate } from "@hono/zod-validator"
import { Hono } from "hono"
import mime from "mime"
import { CaptureJob } from "../lib/classes/job"
import Queue from "../lib/queue"
import { queueCaptureParamsSchema } from "../lib/types"
import Artifact from "../lib/utils/artifact"
import { getJobInfo } from "../lib/utils/helper"

//
import "../lib/events"
import "../lib/workers"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello, world!")
})

/**
 * Create a new job
 */
app.post("/jobs", validate("json", queueCaptureParamsSchema), async (c) => {
  const params = c.req.valid("json")

  try {
    // create job
    const job = await CaptureJob.create(params)

    // add job to queue
    const queueJob = await Queue.add(job)

    // save queueJobId
    await job.update({ queueJobId: queueJob.job.id })

    return c.json({
      success: true,
      data: job,
    })
  } catch (e) {
    return c.json({
      success: false,
      error: (e as Error).message,
    })
  }
})

/**
 * Get job info
 */
app.get("/jobs/:id", async (c) => {
  const id = c.req.param("id")

  try {
    const info = await getJobInfo(id)
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
app.get("/jobs/:id/artifact", async (c) => {
  const id = c.req.param("id")
  try {
    const job = await CaptureJob.findById(id)

    if (!job) {
      throw new Error("job not found")
    }
    if (!job.artifact) {
      throw new Error("artifact not found")
    }

    const stream = await Artifact.geReadStream(job?.artifact)

    return new Response(stream, {
      headers: {
        "content-type": mime.getType(job.artifact) || "application/zip",
        "content-disposition": `attachment; filename="${job.artifact}"`,
      },
    })
  } catch (e) {
    const error = (e as Error).message
    return c.json({ success: false, error }, 400)
  }
})

/**
 * Stop job
 *
 * NOTE: if job in progress, it will not stop immediately
 */
app.get("/jobs/:id/cancel", async (c) => {
  const id = c.req.param("id")

  try {
    // remove job from queue
    const success = await Queue.remove(id)

    // update job
    const job = await CaptureJob.findById(id)
    await job?.update({ status: "canceled" })

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
