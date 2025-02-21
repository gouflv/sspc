import Redis from "ioredis"
import { CaptureJob } from "./classes/job"
import { CaptureTask } from "./classes/task"
import Queue from "./queue"
import Artifact from "./utils/artifact"
import logger from "./utils/logger"
import { RedisURL } from "./utils/redis"
import Workers from "./workers"

// register event listener for expired keys, to cleanup artifacts
const subscriber = new Redis(RedisURL)
subscriber.config("SET", "notify-keyspace-events", "Ex")
subscriber.subscribe("__keyevent@0__:expired")
subscriber.on("message", async (_, expiredKey) => {
  if (!expiredKey.startsWith("job:")) {
    return
  }

  try {
    const isProgress = expiredKey.includes(":task-")

    if (isProgress) {
      const record = await CaptureJob.findById(expiredKey)
      if (record?.artifact) {
        Artifact.remove(record.artifact)
      }
    } else {
      const task = await CaptureTask.findById(expiredKey)
      if (task?.artifact) {
        Artifact.remove(task.artifact)
      }
    }
  } catch (err) {
    logger.error("[events] failed to cleanup expired artifacts", {
      key: expiredKey,
      error: (err as Error).message,
    })
  }
})

// graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing...`)
  await Queue.flow.close()
  await Workers.captureWorker.close()
  await Workers.packageWorker.close()
  await subscriber.quit()
  process.exit(0)
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
