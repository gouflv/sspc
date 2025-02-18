import Queue from "bull"
import JobRunner from "./job-runner"
import logger from "./logger"
import { RedisURL } from "./redis"
import { JobData } from "./types"

const captureJobQueue = new Queue<JobData>("capture-job", RedisURL, {
  limiter: {
    max: 1,
    duration: 5_000,
  },
})

captureJobQueue.process(async (job) => {
  const data = job.data as JobData
  try {
    await JobRunner.exec(data)
    return Promise.resolve()
  } catch (e) {
    return Promise.reject(e)
  }
})

async function add(job: JobData, priority = 1) {
  await captureJobQueue.add(job, {
    jobId: job.id,
    delay: 1_000,
    attempts: parseInt(process.env["JOB_ATTEMPTS"] || "") || 2,
    priority,
    removeOnComplete: true,
    removeOnFail: true,
  })
  logger.debug("Job added to queue", { id: job.id })
}

async function remove(jobIds: string[]) {
  // stop running jobs matching jobIds
  const runningJobs = await captureJobQueue.getJobs(["active"])
  for (const job of runningJobs) {
    if (jobIds.includes(job.id as string)) {
      await job.discard()
    }
  }
  await Promise.all(jobIds.map((id) => captureJobQueue.removeJobs(id)))
}

export default {
  add,
  remove,
}
