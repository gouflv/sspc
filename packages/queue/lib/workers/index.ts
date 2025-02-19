import { Worker } from "bullmq"
import Queue from "../queue"
import {
  CaptureJob,
  CaptureJobQueueName,
  CaptureTask,
  CaptureTaskQueueName,
} from "../types"
import { RedisURL } from "../utils/redis"
import captureJobProcessor from "./capture"
import taskJobProcessor from "./task"

const taskWorker = new Worker<CaptureTask, string>(
  CaptureTaskQueueName,
  taskJobProcessor,
  {
    connection: {
      url: RedisURL,
    },
    concurrency: 1,
  },
)

const captureJobWorker = new Worker<CaptureJob>(
  CaptureJobQueueName,
  captureJobProcessor,
  {
    connection: {
      url: RedisURL,
    },
    concurrency: parseInt(process.env["CAPTURE_CONCURRENCY"] || "") || 2,
  },
)

export default {
  taskQueue: taskWorker,
  captureJobQueue: captureJobWorker,
}

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing...`)
  await Queue.flow.close()
  await taskWorker.close()
  await captureJobWorker.close()
  process.exit(0)
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
