import { assign } from "lodash-es"
import { CaptureProgress } from "../types"
import logger from "../utils/logger"
import redis from "../utils/redis"
import { TaskExpire } from "./task"

function generateId(taskId: string, index: number) {
  return `${taskId}:job-${index}`
}

async function create(taskId: string, index: number) {
  const data: CaptureProgress = {
    id: generateId(taskId, index),
    taskId,
    index,
    status: "running",
    error: null,
    artifact: null,
    duration: null,
  }

  await redis.setJSON(data.id, data, { expire: TaskExpire })

  return data
}

async function findById(id: string) {
  return redis.getJSON<CaptureProgress>(id)
}

async function findAll(taskId: string): Promise<CaptureProgress[]> {
  const keys = await redis.keys(`${taskId}:job-*`)
  const data = await Promise.all(
    keys.map(async (key) => await redis.getJSON<CaptureProgress>(key)),
  )
  return data.filter((job) => job !== null)
}

async function update(
  id: string,
  data: Partial<
    Pick<CaptureProgress, "status" | "error" | "artifact" | "duration">
  >,
) {
  const job = await findById(id)
  if (!job) {
    throw new Error(`Job not found for id: ${id}`)
  }

  assign(job, data)

  await redis.setJSON(id, job)

  logger.info("Job updated", { id: job.id, ...data })

  return job
}

export default {
  create,
  update,
  findAll,
}
