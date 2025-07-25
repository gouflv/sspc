import { Job as QueueJob, Worker } from "bullmq"
import mime from "mime"
import { StepStorage } from "../entities/Step"
import { TaskStorage } from "../entities/Task"
import { env } from "../env"
import { RedisURL } from "../redis"
import capture from "../service/capture"
import { StepIdentity, WorkerResult } from "../types"
import Artifact from "../utils/artifact"
import { toFilename } from "../utils/file"
import logger from "../utils/logger"
import { markStepAsFailed } from "../utils/status"

export const captureWorker = new Worker<any, WorkerResult>(
  "capture",
  async function (queueJob: QueueJob) {
    const stepId = queueJob.name as StepIdentity

    try {
      logger.info("[worker:capture] started", { step: stepId })

      // Retrieves
      const step = await StepStorage.get(stepId)
      if (!step) {
        throw new Error(`Step not found: ${stepId}`)
      }
      const task = await TaskStorage.get(step.taskId)
      if (!task) {
        throw new Error(`Task not found: ${step.taskId}`)
      }

      // Update status
      await TaskStorage.update(task.id, {
        status: "running",
      })
      await StepStorage.update(stepId, {
        status: "running",
      })

      // Capture
      const result = await capture(stepId, task.params)

      // Save artifact
      const filename = toFilename(
        `${stepId}.${mime.getExtension(result.contentType)}`,
      )
      const { size } = await Artifact.save(result.stream, filename)
      const artifact: WorkerResult["artifact"] = {
        contentType: result.contentType,
        filename,
        size,
      }

      // Update status
      await StepStorage.update(stepId, {
        status: "completed",
        artifact,
        finishedAt: Date.now(),
      })

      logger.info("[worker:capture] completed", {
        step: stepId,
        filename,
        size,
        duration: result.duration,
      })

      return {
        step: stepId,
        artifact,
      }
    } catch (e) {
      const error = e as Error
      logger.error("[worker:capture] failed", { step: stepId, error })
      markStepAsFailed(stepId, error)
      throw e
    }
  },
  {
    connection: { url: RedisURL },
    concurrency: env.COMPRESS_CONCURRENCY,
  },
)
