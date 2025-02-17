/**
 * Job management
 *
 * Job id pattern: `${task.id}:job-${job.index}`
 *
 * Example:
 *
 * ```js
 * // create
 * const job = await Job.createByTask(task)
 *
 * // retrieve
 * const job = await Job.findById(job.id)
 * const jobs = await Job.findAllByTask(task.id)
 *
 * // update
 * await Job.update(job.id, { status, error, artifact })
 *
 * // remove
 * await Job.remove(job.id)
 * await Job.removeAllByTask(task.id)
 * ```
 */

import logger from "./logger"
import redis from "./redis"
import { TaskExpire } from "./task"
import { JobData, Status, TaskData } from "./types"

function generateKey(taskId: string, index: number) {
  return [taskId, `job-${index}`].join(":")
}

function generateQueueKey(taskId: string) {
  return `${taskId}:job-*`
}

async function createByTask(task: TaskData): Promise<JobData[]> {
  const jobs = task.params.pages.map((page, index) => {
    return {
      id: generateKey(task.id, index),
      taskId: task.id,
      index,
      status: "pending",
      error: null,
      artifact: null,
    } satisfies JobData
  })
  await Promise.all(
    jobs.map((job) => redis.setJSON(job.id, job, { expire: TaskExpire })),
  )

  logger.info("Jobs created", {
    ids: jobs.map((job) => job.id),
    count: jobs.length,
  })

  return jobs
}

async function findById(id: string) {
  return redis.getJSON<JobData>(id)
}

async function findAllByTask(taskId: string): Promise<JobData[]> {
  const keys = await redis.keys(generateQueueKey(taskId))
  const data = await Promise.all(
    keys.map(async (key) => await redis.getJSON<JobData>(key)),
  )
  return data.filter((job) => job !== null)
}

async function update(
  id: string,
  {
    status,
    error,
    artifact,
  }: Partial<Pick<JobData, "status" | "error" | "artifact">>,
) {
  const job = await findById(id)
  if (!job) {
    throw new Error(`Job not found for id: ${id}`)
  }

  let dirty = false

  if (typeof status !== "undefined" && job.status !== status) {
    dirty = true
    job.status = status
  }
  if (typeof error !== "undefined" && job.error !== error) {
    dirty = true
    job.error = error
  }
  if (typeof artifact !== "undefined" && job.artifact !== artifact) {
    dirty = true
    job.artifact = artifact
  }

  // no need to update
  if (!dirty) return job

  await redis.setJSON(job.id, job)

  logger.info("Job updated", { id: job.id, status, error, artifact })

  return job
}

async function removeAllByTask(taskId: string) {
  const keys = await redis.keys(generateQueueKey(taskId))
  await Promise.all(keys.map((key) => redis.remove(key)))
}

function countByStatus(jobs: JobData[]) {
  const count: Record<Status, number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  }
  for (const job of jobs) {
    count[job.status]++
  }
  return count
}

export default {
  createByTask,
  findById,
  findAllByTask,
  update,
  remove: redis.remove,
  removeAllByTask,
  countByStatus,
}
