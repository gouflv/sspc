import { Job as QueueJob } from "bullmq"
import { some } from "lodash-es"
import Progress from "../entities/progress"
import Task from "../entities/task"
import { CaptureTask } from "../types"
import artifact from "../utils/artifact"
import logger from "../utils/logger"

export default async function (
  queueJob: QueueJob<CaptureTask>,
): Promise<string> {
  logger.info("Task job started", { job: queueJob.name })

  const taskId = queueJob.data.id

  try {
    const progressRecords = await Progress.findAll(taskId)

    const artifacts = progressRecords.map((record) => record.artifact!)

    if (some(artifacts, (artifact) => !artifact)) {
      throw new Error("Some jobs are not completed")
    }

    const filename = `${taskId}.zip`
    await artifact.packageArtifacts(
      progressRecords.map((record) => record.artifact!),
      filename,
    )

    await Task.update(taskId, { artifact: filename })

    return filename
  } catch (e) {
    const error = (e as Error).message

    logger.error("Task job failed", {
      id: queueJob.name,
      error,
    })

    await Task.update(taskId, { error })

    throw e
  }
}
