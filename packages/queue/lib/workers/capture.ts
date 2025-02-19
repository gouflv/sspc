import { Job as QueueJob } from "bullmq"
import Progress from "../entities/progress"
import { CaptureJobPayload, CaptureProgress } from "../types"
import Artifact from "../utils/artifact"
import capture from "../utils/capture"
import logger from "../utils/logger"

export default async function (
  queueJob: QueueJob<CaptureJobPayload>,
): Promise<string> {
  logger.info("Capture job started", { job: queueJob.name })

  let progress: CaptureProgress | null = null

  try {
    const { taskId, index } = queueJob.data

    // create job-progress
    progress = await Progress.create(taskId, index)

    // capture
    const captureResult = await capture(queueJob.name, queueJob.data.params)

    // save artifact
    const filename = `${queueJob.id}.${Artifact.contentType2Extension(captureResult.contentType)}`
    await Artifact.save(captureResult.stream, filename)

    // update job-progress
    await Progress.update(progress.id, {
      status: "completed",
      artifact: filename,
      duration: captureResult.duration,
    })

    return filename
  } catch (e) {
    const error = (e as Error).message

    logger.error("Capture job failed", {
      id: queueJob.name,
      error,
    })

    if (progress) {
      // update job-progress
      await Progress.update(progress.id, {
        status: "failed",
        error,
        artifact: null,
        duration: null,
      })
    }

    throw e
  }
}
