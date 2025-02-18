import { CaptureJobProgress } from "../types"
import logger from "../utils/logger"
import redis from "../utils/redis"
import { TaskExpire } from "./task"

function generateId(taskId: string, index: number) {
  return `${taskId}:job-${index}`
}

async function create(taskId: string, index: number) {
  const data: CaptureJobProgress = {
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
  return redis.getJSON<CaptureJobProgress>(id)
}

async function findAll(taskId: string): Promise<CaptureJobProgress[]> {
  const keys = await redis.keys(`${taskId}:job-*`)
  const data = await Promise.all(
    keys.map(async (key) => await redis.getJSON<CaptureJobProgress>(key)),
  )
  return data.filter((job) => job !== null)
}

async function update(
  id: string,
  data: Partial<
    Pick<CaptureJobProgress, "status" | "error" | "artifact" | "duration">
  >,
) {
  const job = await findById(id)
  if (!job) {
    throw new Error(`Job not found for id: ${id}`)
  }

  let dirty = false
  if (typeof data.status !== "undefined" && job.status !== data.status) {
    dirty = true
    job.status = data.status
  }
  if (typeof data.error !== "undefined" && job.error !== data.error) {
    dirty = true
    job.error = data.error
  }
  if (typeof data.artifact !== "undefined" && job.artifact !== data.artifact) {
    dirty = true
    job.artifact = data.artifact
  }
  if (typeof data.duration !== "undefined" && job.duration !== data.duration) {
    dirty = true
    job.duration = data.duration
  }

  if (!dirty) return job

  await redis.setJSON(id, job)

  logger.info("Job updated", { id: job.id, ...data })

  return job
}

export default {
  create,
  update,
  findAll,
}
