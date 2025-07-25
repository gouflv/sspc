import { zValidator as validate } from "@hono/zod-validator"
import { Hono } from "hono"
import { createTaskEntity, TaskStorage } from "../../lib/entities/Task"
import { default as QueueMan } from "../../lib/queueMan"
import { queueCaptureParamsSchema } from "../../lib/types"
import Artifact from "../../lib/utils/artifact"
import { isCaptureTaskKey } from "../../lib/utils/key"
import { getTaskStatus, waitForTaskComplete } from "../../lib/utils/status"

const jobs = new Hono()

/**
 * Create a new job
 */
jobs.post("/", validate("json", queueCaptureParamsSchema), async (c) => {
  const params = c.req.valid("json")

  try {
    // Create a task entity
    let task = await TaskStorage.save(createTaskEntity({ params }))

    // Dispatch task to queue
    const queueJob = await QueueMan.dispatchTask(task)

    // Save queue job id
    task = await TaskStorage.update(task.id, {
      queueJobId: queueJob.job.id,
    })

    return c.json({
      success: true,
      data: task,
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 400)
  }
})

/**
 * Get job info
 */
jobs.get("/:id", async (c) => {
  const id = c.req.param("id")
  try {
    if (!isCaptureTaskKey(id)) {
      throw new Error("Invalid job ID")
    }
    const status = await getTaskStatus(id)
    return c.json({ success: true, data: status })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 400)
  }
})

/**
 * Get job artifact
 */
jobs.get("/:id/artifact", async (c) => {
  const id = c.req.param("id")
  try {
    if (!isCaptureTaskKey(id)) {
      return c.json({ success: false, error: "Invalid job ID" }, 400)
    }
    const task = await TaskStorage.get(id)
    if (!task) {
      throw new Error("Job not found")
    }

    if (task.status !== "completed" || !task.artifact) {
      throw new Error("Job is not completed")
    }

    const res = await Artifact.createResponse(task.artifact)
    return res
  } catch (e) {
    const error = (e as Error).message
    return c.json({ success: false, error }, 400)
  }
})

/**
 * create job and wait for completion, then return artifact
 */
jobs.post("/urgent", validate("json", queueCaptureParamsSchema), async (c) => {
  const params = c.req.valid("json")

  try {
    // Create a task entity
    const task = await TaskStorage.save(createTaskEntity({ params }))

    // Dispatch task to queue
    await QueueMan.dispatchTask(task)

    // Save queue job id

    await waitForTaskComplete(task.id)

    const done = await TaskStorage.get(task.id)
    if (!done?.artifact) {
      throw new Error("Job did not complete successfully")
    }

    return Artifact.createResponse(done.artifact)
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 400)
  }
})

export default jobs
