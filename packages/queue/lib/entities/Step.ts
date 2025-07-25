import { isEmpty, omit } from "lodash-es"
import { Required } from "utility-types"
import { env } from "../env"
import redis from "../redis"
import {
  Artifact,
  QueueCaptureInputParamsType,
  QueueWorkNames as QueueWorkerNames,
  Status,
  StepIdentity,
  TaskIdentity,
} from "../types"
import {
  generateCaptureStepKey,
  generateCaptureStepListKey,
} from "../utils/key"

export type StepEntity = {
  /**
   * Task ID this step belongs to.
   */
  taskId: TaskIdentity

  /**
   * Unique identifier for the capture step.
   * It can be used as a Redis key.
   */
  id: StepIdentity

  params: Record<string, any>

  /**
   * This is used to identify the worker that processes this step.
   */
  queueWorkerName: QueueWorkerNames

  /**
   * Current status of the capture task.
   */
  status: Status

  /**
   * The artifact produced by the capture step.
   */
  artifact: Artifact | null

  /**
   * Error message if the capture step failed.
   */
  error: string | null

  createdAt: number

  finishedAt: number | null
}

function createStepEntity(
  data: Required<Partial<StepEntity>, "id" | "taskId" | "queueWorkerName">,
): StepEntity {
  return {
    id: data.id,
    taskId: data.taskId,
    params: data.params ?? {},
    queueWorkerName: data.queueWorkerName,
    status: "pending",
    artifact: null,
    error: null,
    createdAt: Date.now(),
    finishedAt: null,
  }
}

/**
 * Create StepEntity by task ID and capture parameters.
 */
export function createStepEntities(
  taskId: TaskIdentity,
  params: QueueCaptureInputParamsType,
): StepEntity[] {
  const result = [
    createStepEntity({
      id: generateCaptureStepKey(taskId, "capture"),
      taskId,
      queueWorkerName: "capture",
      params: omit(params, "pdfCompress"),
    }),
  ]
  if (params.captureFormat === "pdf" && params.pdfCompress) {
    result.push(
      createStepEntity({
        id: generateCaptureStepKey(taskId, "compress"),
        taskId,
        queueWorkerName: "compress",
      }),
    )
  }
  return result
}

/**
 * Save StepEntity to Redis.
 * Also adds the step to the task's step list.
 */
async function save(taskId: TaskIdentity, data: StepEntity) {
  await redis.client.hset(data.id, toJSON(data))
  await redis.client.expire(data.id, env.TASK_EXPIRE)

  const listKey = generateCaptureStepListKey(taskId)
  await redis.client.rpush(listKey, data.id)
  await redis.client.expire(listKey, env.TASK_EXPIRE)
}

async function get(id: StepIdentity) {
  const json = await redis.client.hgetall(id)
  if (!json || isEmpty(json)) {
    return null
  }
  return fromJSON(json)
}

async function getAll(taskId: TaskIdentity) {
  const listKey = generateCaptureStepListKey(taskId)
  const stepIds = await redis.client.lrange(listKey, 0, -1)
  const steps = await Promise.all(
    stepIds.map(async (stepId) => get(stepId as StepIdentity)),
  )
  return steps.filter((step) => step !== null)
}

async function update(id: StepIdentity, data: Partial<StepEntity>) {
  const current = await get(id)
  if (!current) {
    throw new Error(`Step not found: ${id}`)
  }

  const updated = { ...current, ...data }
  await redis.client.hset(id, toJSON(updated))
  return updated
}

function fromJSON(json: Record<string, any>): StepEntity {
  return {
    ...(json as any),
    params: JSON.parse(json.params),
    artifact: json.artifact ? JSON.parse(json.artifact) : null,
  } as StepEntity
}

function toJSON(step: StepEntity): Record<string, any> {
  return {
    ...step,
    params: JSON.stringify(step.params),
    artifact: step.artifact ? JSON.stringify(step.artifact) : null,
  }
}

export const StepStorage = {
  get,
  getAll,
  save,
  update,
}
