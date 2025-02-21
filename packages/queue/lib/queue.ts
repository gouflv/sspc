import { ds } from "@pptr/core"
import {
  DefaultJobOptions,
  FlowProducer,
  JobNode,
  Job as QueueJob,
} from "bullmq"
import { CaptureJob } from "./classes/job"
import { generateTaskId } from "./classes/task"
import { CaptureQueueName, PackageQueueName } from "./types"
import { createCaptureTaskQueueJobData } from "./utils/helper"
import logger from "./utils/logger"
import { client as redisClient } from "./utils/redis"

const flow = new FlowProducer({ connection: redisClient })

const age =
  process.env["NODE_ENV"] === "production" ? ds("1 day") : ds("1 mins")

const attempts =
  parseInt(process.env["JOB_ATTEMPTS"] || "") ||
  (process.env["NODE_ENV"] === "production" ? 2 : 1)

const defaultJobOptions: DefaultJobOptions = {
  attempts,
  delay: 1_000,
  removeOnComplete: { age },
  removeOnFail: { age },
}

function add(job: CaptureJob): Promise<JobNode> {
  return flow.add(
    // use package job as parent job
    {
      name: job.id,
      queueName: PackageQueueName,

      children: job.params.pages.map((page, index) => ({
        name: generateTaskId(job.id, index),
        queueName: CaptureQueueName,

        opts: {
          // IMPORTANT
          failParentOnFailure: true,
        },

        data: createCaptureTaskQueueJobData(job, index),
      })),
    },
    {
      queuesOptions: {
        [PackageQueueName]: {
          defaultJobOptions,
        },
        [CaptureQueueName]: {
          defaultJobOptions,
        },
      },
    },
  )
}

async function findById(queueJobId: string) {
  const { job } = await flow.getFlow({
    queueName: PackageQueueName,
    id: queueJobId,
  })
  return job as QueueJob
}

/**
 * remove parent job and children from queue
 */
async function remove(captureJobId: string) {
  try {
    const captureJob = await CaptureJob.findById(captureJobId)

    if (!captureJob?.queueJobId) {
      return false
    }

    const jobTree = await flow.getFlow({
      id: captureJob.queueJobId,
      queueName: CaptureQueueName,
    })

    if (!jobTree) {
      throw new Error("job not found")
    }

    // Note: move running job will throw

    // remove all child jobs first
    if (jobTree.children?.length) {
      await Promise.all(jobTree.children.map((child) => child.job.remove()))
    }
    // remove parent job
    await jobTree.job.remove()

    logger.info("[queue] job removed from queue", { id: captureJobId })

    return true
  } catch (e) {
    logger.info("[queue] failed to remove job", {
      id: captureJobId,
      error: (e as Error).message,
    })

    return false
  }
}

const Queue = {
  flow,
  add,
  findById,
  remove,
}
export default Queue
