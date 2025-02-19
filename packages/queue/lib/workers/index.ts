import { Worker } from "bullmq"
import {
  CaptureJobPayload,
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
    concurrency: 2,
  },
)

const captureJobWorker = new Worker<CaptureJobPayload>(
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
  taskWorker,
  captureJobWorker,
}
