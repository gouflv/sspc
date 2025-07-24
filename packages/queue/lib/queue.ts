import { ds } from "@pptr/core"
import { DefaultJobOptions, FlowJob, FlowProducer } from "bullmq"
import { StepEntity } from "./entities/Step"
import { TaskEntity } from "./entities/Task"
import { env } from "./env"
import { client as redisClient } from "./redis"

const flow = new FlowProducer({ connection: redisClient })

const keepQueueJobInSeconds =
  env.NODE_ENV === "production" ? ds("1 days") : ds("10 mins")

const attempts = env.NODE_ENV === "production" ? env.JOB_ATTEMPTS : 0

const defaultJobOptions: DefaultJobOptions = {
  attempts,
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

function dispatchTask(task: TaskEntity) {
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
  flow.add(root, {
    queuesOptions: {
      capture: { defaultJobOptions },
      compress: { defaultJobOptions },
    },
  })
}

/**
 * Queue management
 */
const QueueMan = {
  flow,
  dispatchTask,
}
export default QueueMan
