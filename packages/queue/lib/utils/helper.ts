import { countBy, omit } from "lodash-es"
import { CaptureJob } from "../classes/job"
import { CaptureTask } from "../classes/task"
import { CaptureTaskQueueJobData } from "../types"

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
