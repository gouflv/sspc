import { Worker } from "bullmq"
import { CaptureTaskQueueName, PackageQueueName } from "../types"
import { RedisURL } from "../utils/redis"
import captureProcessor from "./capture"
import packageProcessor from "./package"

const captureWorker = new Worker(CaptureTaskQueueName, captureProcessor, {
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

export default { captureWorker, packageWorker }
