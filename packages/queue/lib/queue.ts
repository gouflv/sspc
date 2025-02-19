import { d } from "@pptr/core"
import { DefaultJobOptions, FlowProducer, Job, JobNode } from "bullmq"
import { omit } from "lodash-es"
import {
  CaptureJob,
  CaptureJobQueueName,
  CaptureTask,
  CaptureTaskQueueName,
} from "./types"
import logger from "./utils/logger"
import { client as redisClient } from "./utils/redis"

const flow = new FlowProducer({ connection: redisClient })

const age = process.env["NODE_ENV"] === "development" ? d("1 mins") : d("1 day")

const jobOption: DefaultJobOptions = {
  attempts: parseInt(process.env["JOB_ATTEMPTS"] || "") || 2,
  delay: 1_000,
  removeOnComplete: { age },
  removeOnFail: { age },
}

function add(task: CaptureTask): Promise<JobNode> {
  return flow.add({
    name: task.id,
    queueName: CaptureTaskQueueName,

    opts: jobOption,

    // use CaptureTask as parent job payload
    data: task,

    children: task.params.pages.map((page, index) => ({
      name: `${task.id}:job-${index}`,
      queueName: CaptureJobQueueName,

      opts: {
        // IMPORTANT
        failParentOnFailure: true,
        ...jobOption,
      },

      // use CaptureJob as job payload
      data: createCaptureJob(task, index),
    })),
  })
}

async function findById(queueJobId: string) {
  const { job } = await flow.getFlow({
    queueName: CaptureTaskQueueName,
    id: queueJobId,
  })
  return job as Job<CaptureTask>
}

async function remove(queueJobId: string) {
  const { job, children } = await flow.getFlow({
    id: queueJobId,
    queueName: CaptureTaskQueueName,
  })

  try {
    // Remove all child jobs first
    if (children?.length) {
      await Promise.all(children.map((child) => child.job.remove()))
    }
    // Remove parent job
    await job.remove()

    logger.info("Jobs removed from queue", { queueJobId })

    return true
  } catch (e) {
    logger.debug("Failed to cleanup jobs", {
      queueJobId,
      error: (e as Error).message,
    })
    return false
  }
}

function createCaptureJob(task: CaptureTask, index: number): CaptureJob {
  return {
    taskId: task.id,
    index,
    params: {
      ...omit(task.params, "pages"),
      url: task.params.pages[index].url,
    },
  }
}

export default {
  flow,
  add,
  findById,
  cleanup: remove,
}
