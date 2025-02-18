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

// const captureJobQueue = new Queue<JobData>("capture-job", {
//   connection: redisClient,
//   defaultJobOptions: {
//     attempts: parseInt(process.env["JOB_ATTEMPTS"] || "") || 2,
//     delay: 1_000,
//     removeOnComplete: true,
//     removeOnFail: true,
//   },
// })

// captureJobQueue.process(async (job) => {
//   const data = job.data as JobData
//   try {
//     await JobRunner.exec(data)
//     return Promise.resolve()
//   } catch (e) {
//     return Promise.reject(e)
//   }
// })

const flow = new FlowProducer({ connection: redisClient })

const age =
  process.env["NODE_ENV"] === "development" ? d("10 mins") : d("1 week")

const jobOption: DefaultJobOptions = {
  attempts: parseInt(process.env["JOB_ATTEMPTS"] || "") || 2,
  delay: 1_000,
  removeOnComplete: { age },
  removeOnFail: { age },
}

function add(task: CaptureTask): Promise<JobNode> {
  return flow.add(
    {
      name: task.id,
      queueName: CaptureTaskQueueName,

      // use CaptureTask as parent job payload
      data: task,

      children: task.params.pages.map((page, index) => ({
        name: `${task.id}:job-${index}`,
        queueName: CaptureJobQueueName,

        opts: {
          // IMPORTANT
          failParentOnFailure: true,
        },

        // use CaptureJob as job payload
        data: createCaptureJob(task, index),
      })),
    },
    {
      queuesOptions: {
        [CaptureTaskQueueName]: {
          defaultJobOptions: jobOption,
        },
        [CaptureJobQueueName]: {
          defaultJobOptions: jobOption,
        },
      },
    },
  )
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
  add,
}
