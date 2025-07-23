import { isEmpty, omit } from "lodash-es"
import type { Required } from "utility-types"
import { env } from "../env"
import redis from "../redis"
import { QueueCaptureInputParamsType, Status, TaskKey } from "../types"
import { generateCaptureTaskKey } from "../utils/key"
import { StepEntity, StepStorage } from "./Step"

export type TaskEntity = {
  /**
   * Unique identifier for the capture task.
   * It can be used as a Redis key.
   */
  id: TaskKey

  /**
   * Parameters for the capture task.
   */
  params: QueueCaptureInputParamsType

  /**
   * Current status of the capture task.
   */
  status: Status

  /**
   * The final artifact produced by the capture step.
   */
  artifact: string | null

  /**
   * Error message if the capture step failed.
   */
  error: string | null

  /**
   * The ID of the task in the queue system.
   * This is assigned when the task is added to the queue and is used to track the task's progress and status.
   */
  queueJobId: string | null

  createdAt: number

  finishedAt: number | null

  steps: StepEntity[]
}

export function createTaskEntity(
  data: Required<Partial<TaskEntity>, "params">,
): TaskEntity {
  return {
    id: data.id ?? generateCaptureTaskKey(),
    params: data.params,
    status: data.status ?? "pending",
    artifact: data.artifact ?? null,
    error: data.error ?? null,
    queueJobId: data.queueJobId ?? null,
    createdAt: data.createdAt ?? Date.now(),
    finishedAt: data.finishedAt ?? null,
    steps: data.steps ?? [],
  }
}

async function save(data: TaskEntity) {
  await redis.client.hmset(data.id, toJSON(data))
  await redis.client.expire(data.id, env.TASK_EXPIRE)
  return data
}

/**
 * Retrieves a capture task by its ID.
 * Also fetches all associated steps.
 */
async function get(id: TaskKey) {
  const json = await redis.client.hgetall(id)
  if (!json || isEmpty(json)) {
    return null
  }
  const steps = await StepStorage.getAll(id)
  return fromJSON(json, steps)
}

async function update(id: TaskKey, data: Partial<TaskEntity>) {
  const task = await get(id)
  if (!task) {
    throw new Error(`CaptureTask with id ${id} not found`)
  }
  const updated = { ...task, ...data }
  await save(updated)
  return updated
}

function toJSON(task: TaskEntity): Record<string, any> {
  return {
    ...omit(task, ["steps"]),
    params: JSON.stringify(task.params),
  }
}

function fromJSON(json: Record<string, any>, steps: StepEntity[]) {
  return {
    ...(json as any),
    params: JSON.parse(json.params),
    steps,
  } satisfies TaskEntity
}

export const TaskStorage = {
  get,
  save,
  update,
}
