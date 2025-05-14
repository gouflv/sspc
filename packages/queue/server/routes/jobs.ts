import { zValidator as validate } from "@hono/zod-validator"
import { Hono } from "hono"
import { CaptureJob } from "../../lib/classes/CaptureJob"
import Queue from "../../lib/queue"
import { queueCaptureParamsSchema } from "../../lib/types"
import Artifact from "../../lib/utils/artifact"
import { getJobInfo } from "../../lib/utils/helper"

const jobs = new Hono()

/**
 * Create a new job
 */
jobs.post("/", validate("json", queueCaptureParamsSchema), async (c) => {
  const params = c.req.valid("json")

  try {
    const job = await CaptureJob.create(params)
    const queueJob = await Queue.add(job)
    await job.update({ queueJobId: queueJob.job.id })

    return c.json({
      success: true,
      data: job,
    })
  } catch (e) {
    return c.json(
      {
        success: false,
        error: (e as Error).message,
      },
      400,
    )
  }
})

/**
 * Get job info
 */
jobs.get("/:id", async (c) => {
  const id = c.req.param("id")

  try {
    const info = await getJobInfo(id)
    return c.json({
      success: true,
      data: info,
    })
  } catch (e) {
    return c.json(
      {
        success: false,
        error: (e as Error).message,
      },
      400,
    )
  }
})

/**
 * Get job artifact
 */
jobs.get("/:id/artifact", async (c) => {
  const id = c.req.param("id")
  try {
    const job = await CaptureJob.findById(id)

    if (!job) {
      throw new Error("job not found")
    }

    return Artifact.createResponse(job.id)
  } catch (e) {
    const error = (e as Error).message
    return c.json({ success: false, error }, 400)
  }
})

/**
 * Cancel job
 */
jobs.get("/:id/cancel", async (c) => {
  const id = c.req.param("id")

  try {
    const success = await Queue.remove(id)
    const job = await CaptureJob.findById(id)
    await job?.update({ status: "canceled" })

    return c.json({
      success,
    })
  } catch (e) {
    return c.json(
      {
        success: false,
        error: (e as Error).message,
      },
      400,
    )
  }
})

/**
 * create job and wait for completion, then return artifact
 */
jobs.post("/urgent", validate("json", queueCaptureParamsSchema), async (c) => {
  const params = c.req.valid("json")

  if (params.pages.length !== 1) {
    return c.json(
      {
        success: false,
        error: "only one page is allowed",
      },
      400,
    )
  }

  try {
    const job = await CaptureJob.create(params)
    const queueJob = await Queue.add(job)
    await job.update({ queueJobId: queueJob.job.id })

    await job.waitForComplete()

    return Artifact.createResponse(job.id)
  } catch (e) {
    return c.json(
      {
        success: false,
        error: (e as Error).message,
      },
      400,
    )
  }
})

export default jobs
