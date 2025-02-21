import { Job as QueueJob } from "bullmq"
import { some } from "lodash-es"
import { CaptureJob } from "../classes/job"
import { CaptureTask } from "../classes/task"
import artifact from "../utils/artifact"
import { safeFilename, saveCompletedJobLog } from "../utils/helper"
import logger from "../utils/logger"

/**
 * package worker, related to CaptureJob
 */
export default async function (queueJob: QueueJob): Promise<string> {
  const jobId = queueJob.name

  logger.debug("[worker:package] started", { job: jobId })

  try {
    const job = await CaptureJob.findById(jobId)
    if (!job) {
      throw new Error("[worker:package] job not found")
    }

    // update job status
    await job.update({ status: "running" })

    // get artifacts
    const taskRecords = await CaptureTask.findAll(jobId)
    const artifacts = taskRecords.map((record) => record.artifact!)
    if (some(artifacts, (artifact) => !artifact)) {
      throw new Error("Some jobs are not completed")
    }
    if (artifacts.length !== job.params.pages.length) {
      throw new Error("Some jobs are missing")
    }

    let filename

    if (artifacts.length === 1) {
      // only one page, use the original file
      filename = artifacts[0]
    } else {
      // package
      filename = safeFilename(`${jobId}.zip`)
      await artifact.packageArtifacts(
        artifacts.map((artifact, index) => ({
          filename: artifact,
          distName: job.params.pages[index].name,
        })),
        filename,
      )
    }

    await job.update({
      status: "completed",
      artifact: filename,
    })

    logger.debug("[worker:package] completed", { job: jobId })
    saveCompletedJobLog(job)

    return filename
  } catch (e) {
    const error = (e as Error).message

    logger.error("[worker:package] failed", { job: jobId, error })

    const job = await CaptureJob.findById(jobId)
    if (job) {
      job.update({ status: "failed", error })
    }

    throw e
  }
}
