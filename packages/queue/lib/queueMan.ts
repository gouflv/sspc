import { ds } from "@sspc/core"
import { DefaultJobOptions, FlowJob, FlowProducer, Queue } from "bullmq"
import { StepEntity } from "./entities/Step"
import { TaskEntity } from "./entities/Task"
import { env } from "./env"
import { client as redisClient } from "./redis"

const flow = new FlowProducer({ connection: redisClient })

const keepQueueJobInSeconds = ds("1 hour")

const defaultJobOptions: DefaultJobOptions = {
  attempts: env.JOB_ATTEMPTS,
  removeOnComplete: { age: keepQueueJobInSeconds },
  removeOnFail: { age: keepQueueJobInSeconds },
}

function buildStepJobNode(step: StepEntity, children?: FlowJob[]): FlowJob {
  return {
    name: step.id,
    queueName: step.queueWorkerName,
    data: {},
    opts: {
      failParentOnFailure: true, // Fast fail.
    },
    children,
  }
}

async function dispatchTask(task: TaskEntity) {
  const root: FlowJob = {
    name: task.id,
    queueName: task.queueWorkName,
  }
  // Iterate steps in reverse order.
  // The last step will be the first child of the root job, previous steps will be children of the last step.
  let current: FlowJob = root
  for (let i = task.steps.length - 1; i >= 0; i--) {
    const step = task.steps[i]
    const stepJob = buildStepJobNode(step, current.children)
    current.children = current.children || []
    current.children.push(stepJob)
    current = stepJob
  }
  return await flow.add(root, {
    queuesOptions: {
      root: { defaultJobOptions },
      capture: { defaultJobOptions },
      compress: { defaultJobOptions },
    },
  })
}

// Queue instance matching the FlowProducer
const rootQueue = new Queue("root", { connection: redisClient })
const captureQueue = new Queue("capture", { connection: redisClient })
const compressQueue = new Queue("compress", { connection: redisClient })

/**
 * Queue management
 */
const QueueMan = {
  flow,
  dispatchTask,
  queue: {
    root: rootQueue,
    capture: captureQueue,
    compress: compressQueue,
  },
}
export default QueueMan
