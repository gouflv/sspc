import { ds } from "@pptr/core"
import { env } from "../env"
import redis from "../redis"
import { TaskIdentity } from "../types"

type KEY = `${TaskIdentity}:expire-trigger`

const ExpirationInSeconds =
  env.NODE_ENV === "production" ? env.TASK_EXPIRE : ds("5 mins")

export class CaptureJobExpireTrigger {
  static async upsert(jobId: TaskIdentity) {
    const key = this.generateExpireTriggerKey(jobId)
    await redis.client.set(key, jobId, "EX", ExpirationInSeconds)
  }

  static generateExpireTriggerKey(jobId: TaskIdentity): KEY {
    return `${jobId}:expire-trigger`
  }

  static isExpireTriggerKey(key: string): key is KEY {
    return key.endsWith(":expire-trigger") && key.startsWith("job:")
  }

  static retrieveJobId(key: KEY) {
    if (!this.isExpireTriggerKey(key)) {
      throw new Error(`Invalid key: ${key}`)
    }
    return key.replace(/:expire-trigger$/, "")
  }
}
