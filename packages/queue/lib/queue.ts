import { d } from "@pptr/core"
import {
  DefaultJobOptions,
  FlowProducer,
  JobNode,
  Job as QueueJob,
} from "bullmq"
import Task from "./entities/task"
import { CaptureJobQueueName, CaptureTask, CaptureTaskQueueName } from "./types"
import { createCaptureJobPayload } from "./utils/helper"
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

      data: createCaptureJobPayload(task, index),
    })),
  })
}

async function findById(queueJobId: string) {
  const { job } = await flow.getFlow({
    queueName: CaptureTaskQueueName,
    id: queueJobId,
  })
  return job as QueueJob<CaptureTask>
}

/**
 * remove parent job and children from queue
 */
async function remove(taskId: string) {
  try {
    const task = await Task.findById(taskId)

    if (!task?.queueJobId) {
      return false
    }

    const jobTree = await flow.getFlow({
      id: task.queueJobId,
      queueName: CaptureTaskQueueName,
    })

    if (!jobTree) {
      throw new Error("job not found")
    }

    // Note: move running job will throw
    const { job, children } = jobTree
    // remove all child jobs first
    if (children?.length) {
      await Promise.all(children.map((child) => child.job.remove()))
    }
    // remove parent job
    await job.remove()

    logger.info("[queue] job removed from queue", { id: job.id, taskId })

    return true
  } catch (e) {
    logger.info("[queue] failed to remove job", {
      id: taskId,
      error: (e as Error).message,
    })

    // not throw error
    return false
  }
}

export default {
  flow,
  add,
  findById,
  remove,
}
