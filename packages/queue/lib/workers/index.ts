import { Worker } from "bullmq"
import { RedisURL } from "../redis"
import { CaptureQueueName, PackageQueueName } from "../types"
import captureProcessor from "./capture"
import packageProcessor from "./package"

const captureWorker = new Worker(CaptureQueueName, captureProcessor, {
  connection: {
    url: RedisURL,
  },
  concurrency: parseInt(process.env["CAPTURE_CONCURRENCY"] || "") || 2,
})

const packageWorker = new Worker(PackageQueueName, packageProcessor, {
  connection: {
    url: RedisURL,
  },
  concurrency: 2,
})

const Workers = { captureWorker, packageWorker }
export default Workers
