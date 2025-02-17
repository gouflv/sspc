/**
 * Task management
 *
 * Example:
 *
 * ```js
 * // create
 * const task = await Task.create(params)
 *
 * // retrieve
 * const task = await Task.fromId(id)
 *
 * // update
 * await Task.update({ status, artifact })
 *
 * // more
 * await Task.delete()
 * await Task.exists()
 * ```
 */

import dayjs from "dayjs"
import { v4 as uuid } from "uuid"
import logger from "./logger"
import redis from "./redis"
import { QueueCaptureInputParamsType, TaskData } from "./types"

export const TaskExpire =
  parseInt(process.env.TASK_EXPIRE || "") ||
  (process.env.NODE_ENV === "development"
    ? 1000 * 60 * 10 // 10 minutes
    : 1000 * 60 * 60 * 24 * 14) // 14 days

const TaskPrefix = "task"

function generateKey() {
  const timestamp = dayjs().format("YY-MM-DD-HH-mm-ss".replace(/-/g, ""))
  const uniqueId = uuid().replace(/-/g, "")
  return [TaskPrefix, timestamp, uniqueId].join(":")
}

async function create(params: QueueCaptureInputParamsType): Promise<TaskData> {
  const task: TaskData = {
    id: generateKey(),
    params,
    status: "pending",
    artifact: null,
  }
  await redis.setJSON(task.id, task, { expire: TaskExpire })

  logger.info(`Task created: ${task.id}`, { task })

  return task
}

async function findById(id: string) {
  return redis.getJSON<TaskData>(id)
}

async function update(
  id: string,
  { status, artifact }: Partial<Pick<TaskData, "status" | "artifact">>,
) {
  const task = await findById(id)
  if (!task) {
    throw new Error(`Task not found for id: ${id}`)
  }

  if (status) {
    task.status = status
  }
  if (artifact) {
    task.artifact = artifact
  }

  await redis.setJSON(id, task)
  return task
}

export default {
  create,
  findById,
  update,
  remove: redis.remove,
  exists: redis.exists,
}
