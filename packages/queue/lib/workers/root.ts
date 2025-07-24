import { Job as QueueJob, Worker } from "bullmq"
import { TaskStorage } from "../entities/Task"
import { env } from "../env"
import { RedisURL } from "../redis"
import { TaskIdentity } from "../types"
import logger from "../utils/logger"

export const rootWorker = new Worker(
  "root",
  async function (queueJob: QueueJob) {
    const taskId = queueJob.name as TaskIdentity

    try {
      logger.info("[worker:root] started", { task: taskId })

      // Update status
      await TaskStorage.update(taskId, {
        status: "completed",
        artifact: "root_artifact",
        finishedAt: Date.now(),
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
