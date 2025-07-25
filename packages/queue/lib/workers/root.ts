import { Job as QueueJob, Worker } from "bullmq"
import { first, values } from "lodash-es"
import { TaskStorage } from "../entities/Task"
import { env } from "../env"
import { RedisURL } from "../redis"
import { TaskIdentity, WorkerResult } from "../types"
import logger from "../utils/logger"

export const rootWorker = new Worker(
  "root",
  async function (queueJob: QueueJob) {
    const taskId = queueJob.name as TaskIdentity

    const childrenValues = values(await queueJob.getChildrenValues())
    const previousWorkerResult = first(childrenValues) as
      | WorkerResult
      | undefined
    if (!previousWorkerResult) {
      throw new Error(`No child value found: ${taskId}`)
    }

    try {
      logger.info("[worker:root] started", { task: taskId })

      // Update status
      await TaskStorage.update(taskId, {
        status: "completed",
        artifact: previousWorkerResult.artifact,
        finishedAt: Date.now(),
      })

      logger.info("[worker:root] completed", {
        task: taskId,
        artifact: previousWorkerResult.artifact,
      })
    } catch (e) {
      const error = e as Error
      logger.error("[worker:root] failed", { task: taskId, error })

      throw e
    }
  },
  {
    connection: { url: RedisURL },
    concurrency: env.COMPRESS_CONCURRENCY,
  },
)
