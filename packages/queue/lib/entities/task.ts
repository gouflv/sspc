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

import { d } from "@pptr/core"
import dayjs from "dayjs"
import { assign } from "lodash-es"
import { customAlphabet } from "nanoid"
import { CaptureTask, QueueCaptureInputParamsType } from "../types"
import logger from "../utils/logger"
import redis from "../utils/redis"

const nanoid = customAlphabet("1234567890abcdef", 10)

export const TaskExpire =
  parseInt(process.env.TASK_EXPIRE || "") ||
  (process.env.NODE_ENV === "development" ? d("5 mins") : d("7 days"))

const TaskPrefix = "task"

function generateKey() {
  const timestamp = dayjs().format("YY-MM-DD-HH-mm-ss".replace(/-/g, ""))
  const uniqueId = nanoid()
  return [TaskPrefix, timestamp, uniqueId].join(":")
}

async function create(params: QueueCaptureInputParamsType) {
  const task: CaptureTask = {
    id: generateKey(),
    params,
    status: "pending",
    artifact: null,
    error: null,
    queueJobId: null,
  }
  await redis.setJSON(task.id, task, { expire: TaskExpire })

  logger.info("Task created", { task })

  return task
}

async function findById(id: string) {
  return redis.getJSON<CaptureTask>(id)
}

async function update(
  id: string,
  data: Partial<
    Pick<CaptureTask, "status" | "queueJobId" | "artifact" | "error">
  >,
) {
  const task = await findById(id)
  if (!task) {
    throw new Error(`Task not found for id: ${id}`)
  }

  assign(task, data)

  await redis.setJSON(id, task)

  logger.info("Task updated", { id: task.id, data })

  return task
}

export default {
  create,
  remove: (id: string) => redis.remove(id),
  update,
  findById,
  exists: (id: string) => redis.exists(id),
}
