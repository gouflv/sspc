import { Worker } from "bullmq"
import {
  CaptureJob,
  CaptureJobQueueName,
  CaptureTask,
  CaptureTaskQueueName,
} from "../types"
import { RedisURL } from "../utils/redis"
import captureJobProcessor from "./capture"
import taskJobProcessor from "./task"

const taskQueueWorker = new Worker<CaptureTask, string>(
  CaptureTaskQueueName,
  taskJobProcessor,
  {
    connection: {
      url: RedisURL,
    },
    concurrency: 1,
  },
)

const captureJobQueueWorker = new Worker<CaptureJob>(
  CaptureJobQueueName,
  captureJobProcessor,
  {
    connection: {
      url: RedisURL,
    },
    concurrency: parseInt(process.env["CAPTURE_CONCURRENCY"] || "") || 2,
  },
)

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing server...`)
  await taskQueueWorker.close()
  await captureJobQueueWorker.close()
  process.exit(0)
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

export default {
  taskQueue: taskQueueWorker,
  captureJobQueue: captureJobQueueWorker,
}
