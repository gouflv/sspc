import { ds } from "@pptr/core"
import {
  DefaultJobOptions,
  FlowProducer,
  JobNode,
  Job as QueueJob,
  Queue as QueueMQ,
} from "bullmq"
import { CaptureJob } from "./classes/CaptureJob"
import { client as redisClient } from "./redis"
import { CaptureQueueName, PackageQueueName } from "./types"
import { createCaptureTaskQueueJobData } from "./utils/helper"
import { generateTaskId } from "./utils/id"
import logger from "./utils/logger"

const flow = new FlowProducer({ connection: redisClient })

const KeepQueueJobInSeconds =
  process.env["NODE_ENV"] === "production" ? ds("1 day") : ds("1 mins")

const attempts =
  process.env["NODE_ENV"] === "production"
    ? parseInt(process.env["JOB_ATTEMPTS"] || "2")
    : 0

const defaultJobOptions: DefaultJobOptions = {
  attempts,
  delay: 1_000,
  removeOnComplete: { age: KeepQueueJobInSeconds },
  removeOnFail: { age: KeepQueueJobInSeconds },
}

// shadow queue related to flowProducer
const packageQueue = new QueueMQ(PackageQueueName, { connection: redisClient })
const captureQueue = new QueueMQ(CaptureQueueName, { connection: redisClient })

function add(job: CaptureJob): Promise<JobNode> {
  let priority = 3 // use lowest priority for large jobs
  if (job.params.pages.length === 1) {
    priority = 1
  } else if (job.params.pages.length <= 50) {
    priority = 2
  }

  return flow.add(
    // use package job as parent job
    {
      name: job.id,
      queueName: PackageQueueName,

      opts: { priority },

      children: job.params.pages.map((page, index) => ({
        name: generateTaskId(job.id, index),
        queueName: CaptureQueueName,

        opts: {
          priority,
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
  packageQueue,
  captureQueue,
  flow,
  add,
  findById,
  remove,
}
export default Queue
