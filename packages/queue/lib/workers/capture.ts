import { Job } from "bullmq"
import JobProgress from "../entities/job-progress"
import { CaptureJob, CaptureJobProgress } from "../types"
import Artifact from "../utils/artifact"
import capture from "../utils/capture"
import logger from "../utils/logger"

export default async function (queueJob: Job<CaptureJob>): Promise<string> {
  logger.info("Capture job started", { job: queueJob.name })

  let progress: CaptureJobProgress | null = null

  try {
    const { taskId, index } = queueJob.data

    // create job-progress
    progress = await JobProgress.create(taskId, index)

    // capture
    const captureResult = await capture(queueJob.name, queueJob.data.params)

    // save artifact
    const filename = `${queueJob.id}.${Artifact.contentType2Extension(captureResult.contentType)}`
    await Artifact.save(captureResult.stream, filename)

    // update job-progress
    await JobProgress.update(progress.id, {
      status: "completed",
      artifact: filename,
      duration: captureResult.duration,
    })

    return filename
  } catch (e) {
    logger.error("Capture job failed", {
      job: queueJob.name,
      error: (e as Error).message,
    })

    if (progress) {
      // update job-progress
      await JobProgress.update(progress.id, {
        status: "failed",
        error: (e as Error).message,
        artifact: null,
        duration: null,
      })
    }

    throw e
  }
}
