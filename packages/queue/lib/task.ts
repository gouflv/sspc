import dayjs from "dayjs"
import { isEmpty } from "lodash-es"
import { v4 as uuid } from "uuid"
import { getRedisClient } from "./redis"
import { QueueCaptureParamsType } from "./types"

/**
 * Task
 *  id
 *  params: QueueCaptureParamsType
 *  status: pending | running | completed | failed
 *
 *  jobs
 *   taskId
 *   id
 *   params: CaptureParamsType
 *   status: pending | running | completed | failed
 *   artifact
 */

type Status = "pending" | "running" | "completed" | "failed"

type TaskData = {
  id: string
  params: QueueCaptureParamsType
  status: Status
}

export class Task {
  static client = getRedisClient()

  static async fromId(id: string) {
    const data = (await Task.client.hgetall(id)) as unknown as TaskData
    if (isEmpty(data)) {
      return null
    }
    return Task.fromData(data)
  }

  static fromData(data: TaskData) {
    const task = new Task()
    task.id = data.id
    task.params = data.params
    task.status = data.status
    return task
  }

  static async create(params: QueueCaptureParamsType) {
    const task = new Task()
    task.params = params
    await task.save()
    return task
  }

  static EXPIRE = process.env["TASK_EXPIRE"] || 60 * 60 * 24 * 31 // 31 days

  id: string | null = null
  status: Status = "pending"
  params: QueueCaptureParamsType | null = null

  async save() {
    this.id = this.getId()
    const data = this.toData()
    await Task.client.hset(this.id, data)
    await Task.client.expire(this.id, Task.EXPIRE)
    return data
  }

  async updateStatus(status: Status) {
    if (!(await this.exists())) {
      throw new Error("Task does not exist")
    }
    this.status = status
    await this.save()
  }

  async exists() {
    if (!this.id) return false
    return (await Task.client.exists(this.id)) === 1
  }

  async delete() {
    if (!this.id) return
    await Task.client.del(this.id)
  }

  getId() {
    if (this.id) {
      return this.id
    }
    return ["task", dayjs().format("YYYYMMDDHHmmss"), uuid()].join(":")
  }

  toData(): TaskData {
    if (!this.id) {
      throw new Error("Task is missing id")
    }
    if (!this.params) {
      throw new Error("Task is missing params")
    }
    return {
      id: this.id,
      params: this.params,
      status: this.status,
    }
  }
}
