/**
 * CaptureJob management
 *
 * Example:
 *
 * ```js
 * // create
 * const job = await CaptureJob.create(params)
 *
 * // delete
 * await job.delete()
 *
 * // update
 * await job.update({ status, artifact })
 *
 * // retrieve
 * const job = await CaptureJob.fromId(id)
 * await job.exists()
 * ```
 */

import { assign, isEmpty } from "lodash-es"
import redis from "../redis"
import { CaptureJobId, QueueCaptureInputParamsType, Status } from "../types"
import { logJob, WaitOptions, waitUntil } from "../utils/helper"
import { generateJobId } from "../utils/id"
import logger from "../utils/logger"
import { CaptureJobExpireTrigger } from "./CaptureJobExpireTrigger"

type CaptureJobJSONRaw = {
  id: string
  params: string
  status: Status
  artifact: string | null
  error: string | null
  queueJobId: string | null
}

export class CaptureJob {
  public readonly id: CaptureJobId

  // assign a queue job id when the task add into the queue
  public queueJobId: string | null = null

  constructor(
    public readonly params: QueueCaptureInputParamsType,

    public status: Status,

    public artifact: string | null,

    public error: string | null,

    id?: CaptureJobId,

    queueJobId?: string,
  ) {
    this.id = id || generateJobId()

    if (queueJobId) {
      this.queueJobId = queueJobId
    }
  }

  /**
   * create a task and save it to the redis
   */
  static async create(params: QueueCaptureInputParamsType) {
    const job = new this(params, "pending", null, null)
    await job.save()

    logger.info("[capture-job] created", { job })
    logJob(job)

    return job
  }

  static fromJSON(json: CaptureJobJSONRaw) {
    return new this(
      JSON.parse(json.params),
      json.status,
      json.artifact,
      json.error,
      json.id as CaptureJobId,
      json.queueJobId || undefined,
    )
  }

  static async findById(id: string) {
    const json = (await redis.client.hgetall(id)) as CaptureJobJSONRaw
    if (!json || isEmpty(json)) {
      return null
    }
    return this.fromJSON(json)
  }

  async save() {
    await redis.client.hset(this.id, this.serialize())
    await CaptureJobExpireTrigger.upsert(this.id)
  }

  async remove() {
    await redis.client.del(this.id)
  }

  async update(
    data: Partial<
      Pick<CaptureJob, "queueJobId" | "status" | "artifact" | "error">
    >,
  ) {
    // assign the new data to the current instance
    assign(this, data)

    await this.save()

    await CaptureJobExpireTrigger.upsert(this.id)

    logger.info("[capture-job] updated", { data })

    return this
  }

  async exists() {
    return (await redis.client.exists(this.id)) === 1
  }

  async waitForComplete(options?: Partial<WaitOptions>) {
    return waitUntil(async () => {
      const job = await CaptureJob.findById(this.id)
      if (!job) {
        throw new Error("Job not found")
      }
      if (job.status === "failed") {
        throw new Error(job.error || "Job failed")
      }
      if (job.status === "completed" && job.artifact) {
        return true
      }

      return false
    }, options)
  }

  serialize(): CaptureJobJSONRaw {
    return {
      id: this.id,
      params: JSON.stringify(this.params),
      status: this.status,
      artifact: this.artifact,
      error: this.error,
      queueJobId: this.queueJobId,
    }
  }
}
