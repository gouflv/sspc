import { d } from "@pptr/core"
import { DefaultJobOptions, FlowProducer, JobNode } from "bullmq"
import { omit } from "lodash-es"
import {
  CaptureJob,
  CaptureJobQueueName,
  CaptureTask,
  CaptureTaskQueueName,
} from "./types"
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
}
