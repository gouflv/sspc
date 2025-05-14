import { ds } from "@pptr/core"
import redis from "../redis"

type KEY = `${string}:expire-trigger`

export const expire =
  parseInt(process.env.JOB_EXPIRE || "") ||
  (process.env.NODE_ENV === "production" ? ds("1 day") : ds("1 mins"))

export class CaptureJobExpireTrigger {
  static async upsert(jobId: string) {
    const key = this.generateExpireTriggerKey(jobId)
    await redis.client.set(key, jobId, "EX", expire)
  }

  static generateExpireTriggerKey(jobId: string): KEY {
    return `${jobId}:expire-trigger`
  }

  static isExpireTriggerKey(key: string): key is KEY {
    return key.endsWith(":expire-trigger")
  }

  static retrieveJobId(key: KEY) {
    if (!this.isExpireTriggerKey(key)) {
      throw new Error(`Invalid key: ${key}`)
    }
    return key.replace(/:expire-trigger$/, "")
  }
}
