import { d } from "@pptr/core"
import dayjs from "dayjs"
import { countBy, omit } from "lodash-es"
import { CaptureJob } from "../classes/job"
import { CaptureTask } from "../classes/task"
import { CaptureTaskQueueJobData } from "../types"
import redis from "./redis"

export async function getJobInfo(id: string) {
  const job = await CaptureJob.findById(id)

  if (!job) {
    throw new Error(`job not found: ${id}`)
  }

  const progressRecords = await CaptureTask.findAll(id)
  const statusCount = countBy(progressRecords, (it) => it.status)

  const info = {
    ...job,
    progress: {
      total: job.params.pages.length,
      pending: statusCount["pending"] || 0,
      running: statusCount["running"] || 0,
      completed: statusCount["completed"] || 0,
      failed: statusCount["failed"] || 0,
    },
    children: progressRecords,
  }
  return info
}

export function createCaptureTaskQueueJobData(
  job: CaptureJob,
  index: number,
): CaptureTaskQueueJobData {
  return {
    jobId: job.id,
    index,
    params: {
      ...omit(job.params, "pages"),
      url: job.params.pages[index].url,
    },
  }
}

export function safeFilename(id: string) {
  return id.replace(/[^A-Za-z0-9-_.]/g, "_")
}

export async function saveJobLog(job: CaptureJob) {
  await redis.client.xadd(
    "job:logs",
    "*",
    "date",
    dayjs().format("YYYY-MM-DD HH:mm:ss"),
    "job",
    job.id,
    "params",
    JSON.stringify(job.params),
  )
}

export async function saveCompletedJobLog(job: CaptureJob) {
  await redis.client.lpush("job:completed", job.id)
}

export interface WaitOptions {
  pollInterval: number
  maxWaitTime: number
}

export async function waitUntil(
  check: () => Promise<boolean>,
  options?: Partial<WaitOptions>,
): Promise<boolean> {
  const config: WaitOptions = {
    pollInterval: d("2 second"),
    maxWaitTime: d("3 mins"),
    ...options,
  }
  const startTime = Date.now()
  while (true) {
    try {
      const result = await check()
      if (result) return result
    } catch (e) {
      throw e
    }
    if (Date.now() - startTime > config.maxWaitTime) {
      throw new Error("Wait timeout")
    }
    await new Promise((resolve) => setTimeout(resolve, config.pollInterval))
  }
}
