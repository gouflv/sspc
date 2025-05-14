import { assign, isEmpty } from "lodash-es"
import redis from "../redis"
import { Status } from "../types"
import { CaptureJobExpireTrigger } from "./CaptureJobExpireTrigger"

export function generateTaskId(jobId: string, index: number) {
  return `${jobId}:task-${index}`
}

type CaptureTaskJSONRaw = {
  jobId: string
  index: number
  status: Status
  error: string | null
  artifact: string | null
  duration: number | null
}

export class CaptureTask {
  public error: string | null = null
  public artifact: string | null = null
  public duration: number | null = null

  public id: string

  constructor(
    public readonly jobId: string,
    public readonly index: number,
    public status: Status = "running",
  ) {
    this.id = generateTaskId(jobId, index)
  }

  static async create(jobId: string, index: number) {
    const task = new this(jobId, index)
    await task.save()
    return task
  }

  static async findById(id: string) {
    const json = (await redis.client.hgetall(
      id,
    )) as unknown as CaptureTaskJSONRaw
    if (isEmpty(json)) {
      return null
    }
    return CaptureTask.fromJSON(json)
  }

  static async findAll(jobId: string) {
    const keys = await redis.client.keys(`${jobId}:task-*`)
    const data = await Promise.all(
      keys.map(async (key) => CaptureTask.findById(key)),
    )
    return data.filter((task) => task !== null)
  }

  static fromJSON(json: CaptureTaskJSONRaw) {
    const task = new this(json.jobId, json.index, json.status)
    task.error = json.error
    task.artifact = json.artifact
    task.duration = json.duration
    return task
  }

  async save() {
    await redis.client.hset(this.id, this.serialize())
  }

  async update(
    data: Partial<
      Pick<CaptureTask, "status" | "error" | "artifact" | "duration">
    >,
  ) {
    // assign the new data to the current instance
    assign(this, data)

    await this.save()

    // update the job expire trigger when the task is updated
    await CaptureJobExpireTrigger.upsert(this.jobId)
  }

  async remove() {
    await redis.client.del(this.id)
  }

  serialize(): CaptureTaskJSONRaw {
    return {
      jobId: this.jobId,
      index: this.index,
      status: this.status,
      error: this.error,
      artifact: this.artifact,
      duration: this.duration,
    }
  }
}
