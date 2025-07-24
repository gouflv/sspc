import { isEmpty, omit } from "lodash-es"
import type { Required } from "utility-types"
import { env } from "../env"
import redis from "../redis"
import {
  QueueCaptureInputParamsType,
  QueueWorkNames,
  Status,
  TaskIdentity,
} from "../types"
import { generateCaptureTaskKey } from "../utils/key"
import { createSteps, StepEntity, StepStorage } from "./Step"

export type TaskEntity = {
  /**
   * Unique identifier for the capture task.
   * It can be used as a Redis key.
   */
  id: TaskIdentity

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
   * This is used to identify the worker that processes this step.
   */
  queueWorkName: QueueWorkNames

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
  const id = data.id ?? generateCaptureTaskKey()
  return {
    id,
    params: data.params,
    status: data.status ?? "pending",
    artifact: data.artifact ?? null,
    error: data.error ?? null,
    queueWorkName: "root",
    queueJobId: data.queueJobId ?? null,
    createdAt: data.createdAt ?? Date.now(),
    finishedAt: data.finishedAt ?? null,
    steps: data.steps ?? createSteps(id, data.params),
  }
}

/**
 * Saves a capture task to Redis.
 * Also saves all associated steps.
 */
async function save(data: TaskEntity) {
  await redis.client.hmset(data.id, toJSON(data))
  await redis.client.expire(data.id, env.TASK_EXPIRE)

  data.steps.forEach(async (step) => {
    await StepStorage.save(data.id, step)
  })

  return data
}

/**
 * Retrieves a capture task by its ID.
 * Also fetches all associated steps.
 */
async function get(id: TaskIdentity) {
  const json = await redis.client.hgetall(id)
  if (!json || isEmpty(json)) {
    return null
  }
  const steps = await StepStorage.getAll(id)
  return fromJSON(json, steps)
}

async function update(id: TaskIdentity, data: Partial<TaskEntity>) {
  const current = await get(id)
  if (!current) {
    throw new Error(`Task with id ${id} not found`)
  }
  const updated = { ...current, ...data }
  await redis.client.hset(id, toJSON(updated))
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
  } as TaskEntity
}

export const TaskStorage = {
  get,
  save,
  update,
}
