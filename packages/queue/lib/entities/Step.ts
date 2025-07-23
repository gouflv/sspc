import { isEmpty } from "lodash-es"
import { env } from "../env"
import redis from "../redis"
import {
  QueueCaptureInputParamsType,
  QueueWorkNames,
  Status,
  TaskKey,
} from "../types"
import {
  generateCaptureStepKey,
  generateCaptureStepListKey,
} from "../utils/key"

export type StepEntity = {
  /**
   * Unique identifier for the capture step.
   */
  id: string

  /**
   * Queue work name this step belongs to.
   * This is used to identify the worker that processes this step.
   */
  name: QueueWorkNames

  /**
   * Parameters for the capture task.
   */
  params: QueueCaptureInputParamsType

  /**
   * Current status of the capture task.
   */
  status: Status

  /**
   * The artifact produced by the capture step.
   */
  artifact: string | null

  /**
   * Error message if the capture step failed.
   */
  error: string | null

  createdAt: number

  finishedAt: number | null
}

export function createStepEntity(
  id: string,
  name: QueueWorkNames,
  params: QueueCaptureInputParamsType,
): StepEntity {
  return {
    id,
    name,
    params,
    status: "pending",
    artifact: null,
    error: null,
    createdAt: Date.now(),
    finishedAt: null,
  }
}

export function transformCaptureParamsToStep(
  params: QueueCaptureInputParamsType,
): StepEntity[] {
  const result = [createStepEntity("capture", "capture", params)]
  if (params.pdfCompress) {
    result.push(createStepEntity("compress", "compress", params))
  }
  return result
}

async function save(taskId: TaskKey, data: StepEntity) {
  const key = generateCaptureStepKey(taskId, data.id)
  await redis.client.hset(key, toJSON(data))
  await redis.client.expire(key, env.TASK_EXPIRE)

  const listKey = generateCaptureStepListKey(taskId)
  await redis.client.rpush(listKey, data.id)
  await redis.client.expire(listKey, env.TASK_EXPIRE)
}

async function get(taskId: TaskKey, stepId: string) {
  const key = generateCaptureStepKey(taskId, stepId)
  const json = await redis.client.hgetall(key)
  if (!json || isEmpty(json)) {
    return null
  }
  return fromJSON(json)
}

async function getAll(taskId: TaskKey) {
  const key = generateCaptureStepListKey(taskId)
  const stepIds = await redis.client.lrange(key, 0, -1)
  const steps = await Promise.all(
    stepIds.map(async (stepId) =>
      get(taskId, generateCaptureStepKey(taskId, stepId)),
    ),
  )
  return steps.filter((step) => step !== null)
}

async function update(
  taskId: TaskKey,
  stepId: string,
  data: Partial<StepEntity>,
) {
  const key = generateCaptureStepKey(taskId, stepId)
  await redis.client.hset(key, data)
}

function fromJSON(json: Record<string, any>): StepEntity {
  return {
    ...(json as any),
    params: JSON.parse(json.params),
  } satisfies StepEntity
}

function toJSON(step: StepEntity): Record<string, any> {
  return {
    ...step,
    params: JSON.stringify(step.params),
  }
}

export const StepStorage = {
  get,
  getAll,
  save,
  update,
}
