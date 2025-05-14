import Redis from "ioredis"
import { CaptureJob } from "./classes/CaptureJob"
import { CaptureJobExpireTrigger } from "./classes/CaptureJobExpireTrigger"
import { CaptureTask } from "./classes/CaptureTask"
import Queue from "./queue"
import { RedisURL } from "./redis"
import Artifact from "./utils/artifact"
import Workers from "./workers"

// register event listener for expired keys, used to clean up artifacts
const subscriber = new Redis(RedisURL)
subscriber.config("SET", "notify-keyspace-events", "Ex")
subscriber.subscribe("__keyevent@0__:expired")
subscriber.on("message", async (_, expiredKey) => {
  if (!expiredKey.startsWith("job:")) {
    return
  }

  if (CaptureJobExpireTrigger.isExpireTriggerKey(expiredKey)) {
    const jobId = CaptureJobExpireTrigger.retrieveJobId(expiredKey)

    const job = await CaptureJob.findById(jobId)
    if (job) {
      await job.remove()
      if (job.artifact) await Artifact.remove(job.artifact)
    }

    const tasks = await CaptureTask.findAll(jobId)
    await Promise.all(
      tasks.map(async (task) => {
        await task.remove()
        if (task.artifact) await Artifact.remove(task.artifact)
      }),
    )
  }
})

// graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing...\n`)
  await Queue.flow.close()
  await Workers.captureWorker.close()
  await Workers.packageWorker.close()
  await subscriber.quit()
  process.exit(0)
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
