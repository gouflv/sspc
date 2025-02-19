import { Job as QueueJob } from "bullmq"
import { some } from "lodash-es"
import Progress from "../entities/progress"
import Task from "../entities/task"
import { CaptureTask } from "../types"
import artifact from "../utils/artifact"
import { safeFilename } from "../utils/helper"
import logger from "../utils/logger"

export default async function (
  queueJob: QueueJob<CaptureTask>,
): Promise<string> {
  logger.debug("[worker:task] started", { job: queueJob.name })

  const task = queueJob.data
  const { id: taskId, params: captureParams } = task

  try {
    const progressRecords = await Progress.findAll(taskId)

    const artifacts = progressRecords.map((record) => record.artifact!)

    if (some(artifacts, (artifact) => !artifact)) {
      throw new Error("Some jobs are not completed")
    }
    if (artifacts.length !== captureParams.pages.length) {
      throw new Error("Some jobs are missing")
    }

    const filename = safeFilename(`${taskId}.zip`)

    await artifact.packageArtifacts(
      artifacts.map((artifact, index) => ({
        filename: artifact,
        distName: captureParams.pages[index].name,
      })),
      filename,
    )

    await Task.update(taskId, {
      status: "completed",
      artifact: filename,
    })

    logger.debug("[worker:task] completed", { job: queueJob.name })

    return filename
  } catch (e) {
    const error = (e as Error).message

    logger.error("[worker:task] failed", {
      id: queueJob.name,
      taskId,
      error,
    })

    await Task.update(taskId, {
      status: "failed",
      error,
    })

    throw e
  }
}
