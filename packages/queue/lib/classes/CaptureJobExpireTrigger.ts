import { ds } from "@pptr/core"
import redis from "../redis"
import { CaptureJobId } from "../types"

type KEY = `${CaptureJobId}:expire-trigger`

const ExpirationInSeconds =
  parseInt(process.env.JOB_EXPIRE || "") ||
  (process.env.NODE_ENV === "production" ? ds("1 day") : ds("1 mins"))

export class CaptureJobExpireTrigger {
  static async upsert(jobId: CaptureJobId) {
    const key = this.generateExpireTriggerKey(jobId)
    await redis.client.set(key, jobId, "EX", ExpirationInSeconds)
  }

  static generateExpireTriggerKey(jobId: CaptureJobId): KEY {
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
