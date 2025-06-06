import { Worker } from "bullmq"
import { env } from "../env"
import { RedisURL } from "../redis"
import { CaptureQueueName, PackageQueueName } from "../types"
import captureProcessor from "./capture"
import packageProcessor from "./package"

const captureWorker = new Worker(CaptureQueueName, captureProcessor, {
  connection: {
    url: RedisURL,
  },
  concurrency: env.CAPTURE_CONCURRENCY,
})

const packageWorker = new Worker(PackageQueueName, packageProcessor, {
  connection: {
    url: RedisURL,
  },
  concurrency: 2,
})

const Workers = { captureWorker, packageWorker }
export default Workers
