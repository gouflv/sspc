import { zValidator as validate } from "@hono/zod-validator"
import { Hono } from "hono"
import { createTaskEntity, TaskStorage } from "../../lib/entities/Task"
import QueueMan from "../../lib/queue"
import { queueCaptureParamsSchema } from "../../lib/types"

const jobs = new Hono()

/**
 * Create a new job
 */
jobs.post("/", validate("json", queueCaptureParamsSchema), async (c) => {
  const params = c.req.valid("json")
  console.log("Received params:", params)

  try {
    // Create a task entity
    const task = await TaskStorage.save(createTaskEntity({ params }))

    // Dispatch task to queue
    QueueMan.dispatchTask(task)

    // Save queue job id
    // await TaskStorage.update(task.id, {})

    return c.json({
      success: true,
      data: task,
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
// jobs.get("/:id", async (c) => {
//   const id = c.req.param("id")
//   try {
//     if (!isCaptureTaskKey(id)) {
//       throw new Error("invalid format for job id")
//     }
//     const status = await getJobStatus(id)
//     return c.json({ success: true, data: status })
//   } catch (e) {
//     return c.json({ success: false, error: (e as Error).message }, 400)
//   }
// })

/**
 * Get job artifact
 */
// jobs.get("/:id/artifact", async (c) => {
//   const id = c.req.param("id")
//   try {
//     const job = await CaptureJob.findById(id)

//     if (!job) {
//       throw new Error("job not found")
//     }

//     const res = await Artifact.createResponse(job.id)
//     return res
//   } catch (e) {
//     const error = (e as Error).message
//     return c.json({ success: false, error }, 400)
//   }
// })

/**
 * create job and wait for completion, then return artifact
 */
// jobs.post("/urgent", validate("json", queueCaptureParamsSchema), async (c) => {
//   const params = c.req.valid("json")

//   if (params.pages.length !== 1) {
//     return c.json(
//       {
//         success: false,
//         error: "only one page is allowed",
//       },
//       400,
//     )
//   }

//   try {
//     const job = await CaptureJob.create(params)
//     const queueJob = await QueueMan.add(job)
//     await job.update({ queueJobId: queueJob.job.id })

//     await job.waitForComplete()

//     return Artifact.createResponse(job.id)
//   } catch (e) {
//     return c.json(
//       {
//         success: false,
//         error: (e as Error).message,
//       },
//       400,
//     )
//   }
// })

export default jobs
