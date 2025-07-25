import { pick } from "lodash-es"
import { StepStorage } from "../entities/Step"
import { TaskEntity, TaskStorage } from "../entities/Task"
import { StepIdentity, TaskIdentity } from "../types"
import logger from "./logger"
import { WaitOptions, waitUntil } from "./waitUntil"

type TaskStatus = Pick<
  TaskEntity,
  "id" | "status" | "error" | "createdAt" | "finishedAt"
>

export async function getTaskStatus(id: TaskIdentity): Promise<TaskStatus> {
  const task = await TaskStorage.get(id)
  if (!task) {
    throw new Error(`Task not found: ${id}`)
  }
  return pick(task, ["id", "status", "error", "createdAt", "finishedAt"])
}

export async function markStepAsFailed(stepId: StepIdentity, error: Error) {
  try {
    const step = await StepStorage.update(stepId, {
      status: "failed",
      error: error.message,
    })

    const task = await TaskStorage.get(step.taskId)
    if (!task) {
      throw new Error(`Task not found for step: ${stepId}`)
    }
    await TaskStorage.update(task.id, {
      status: "failed",
      error: error.message,
    })
  } catch (updateError) {
    logger.error("markStepAsFailed", {
      step: stepId,
      error: updateError,
    })
  }
}

export async function waitForTaskComplete(
  id: TaskIdentity,
  options?: Partial<WaitOptions>,
) {
  return waitUntil(async () => {
    const task = await TaskStorage.get(id)
    if (!task) {
      throw new Error("Job not found")
    }
    if (task.status === "failed") {
      throw new Error(task.error || "Job failed")
    }
    if (task.status === "completed" && task.artifact) {
      return true
    }

    return false
  }, options)
}
