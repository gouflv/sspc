import { Job as QueueJob } from "bullmq"
import mime from "mime"
import { CaptureJob } from "../classes/CaptureJob"
import { CaptureTask } from "../classes/CaptureTask"
import { CaptureTaskQueueJobData } from "../types"
import Artifact from "../utils/artifact"
import capture from "../utils/capture"
import { safeFilename } from "../utils/helper"
import logger from "../utils/logger"

/**
 * capture worker, related to CaptureTask
 */
export default async function (
  queueJob: QueueJob<CaptureTaskQueueJobData>,
): Promise<string> {
  const { jobId, index, params: captureParams } = queueJob.data

  const taskId = queueJob.name

  let taskRecord: CaptureTask | null = null

  try {
    logger.info("[worker:capture] started", { task: taskId })

    // create task record
    taskRecord = await CaptureTask.create(jobId, index)

    // capture
    const captureResult = await capture(taskId, captureParams)

    // save artifact
    const filename = safeFilename(
      `${taskId}.${mime.getExtension(captureResult.contentType)}`,
    )
    await Artifact.save(captureResult.stream, filename)

    // update taskRecord
    await taskRecord.update({
      status: "completed",
      artifact: filename,
      duration: captureResult.duration,
    })

    logger.info("[worker:capture] completed", {
      task: taskId,
      filename,
      duration: captureResult.duration,
    })

    return filename
  } catch (e) {
    const error = e as Error

    logger.error("[worker:capture] failed", { task: taskId, error })

    // update taskRecord
    if (taskRecord) {
      await taskRecord.update({ status: "failed", error: error.message })
    } else {
      logger.error("[worker:capture] failed to update task, task no found", {
        task: taskId,
      })
    }

    // update jobRecord
    const jobRecord = await CaptureJob.findById(jobId)
    if (jobRecord) {
      await jobRecord.update({ status: "failed", error: error.message })
    } else {
      logger.error("[worker:capture] failed to update job, job no found", {
        job: jobId,
      })
    }

    throw e
  }
}
