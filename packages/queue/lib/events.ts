import Redis from "ioredis"
import { RedisURL } from "./redis"
import Artifact from "./utils/artifact"
import { isCaptureTaskKey } from "./utils/key"
import Workers from "./workers"

// Listen for key expiration events
const subscriber = new Redis(RedisURL)
subscriber.config("SET", "notify-keyspace-events", "Ex")
subscriber.subscribe("__keyevent@0__:expired")
subscriber.on("message", async (_, expiredKey) => {
  if (isCaptureTaskKey(expiredKey)) {
    console.log(`Capture task expired: ${expiredKey}`)
    // Clean up artifacts related to the expired task
    Artifact.removeByTaskKey(expiredKey)
  }
})

// Shutdown safely
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing...\n`)
  await subscriber.quit()
  await Workers.rootWorker.close()
  await Workers.captureWorker.close()
  await Workers.compressWorker.close()
  process.exit(0)
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
