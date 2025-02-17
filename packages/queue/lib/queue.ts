import Queue from "bull"
import JobRunner from "./job-runner"
import logger from "./logger"
import { RedisURL } from "./redis"
import { JobData } from "./types"

const queue = new Queue("capture-job", RedisURL, {
  limiter: {
    max: 1,
    duration: 5_000,
  },
})

queue.process(async (job) => {
  const data = job.data as JobData
  try {
    await JobRunner.exec(data)
    return Promise.resolve()
  } catch (e) {
    return Promise.reject(e)
  }
})

async function add(job: JobData) {
  await queue.add(job, {
    jobId: job.id,
    delay: 1_000,
    attempts: parseInt(process.env["JOB_ATTEMPTS"] || "") || 2,
    removeOnComplete: true,
    removeOnFail: true,
  })
  logger.debug("Job added to queue", { id: job.id })
}

export default {
  add,
}
