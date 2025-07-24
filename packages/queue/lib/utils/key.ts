import dayjs from "dayjs"
import { customAlphabet } from "nanoid"
import { StepIdentity, TaskIdentity } from "../types"

const nanoid = customAlphabet("1234567890abcdef", 10)

export function generateCaptureTaskKey(): TaskIdentity {
  const timestamp = dayjs().format("YY-MM-DD-HH-mm-ss".replace(/-/g, ""))
  const uniqueId = nanoid()
  return `capture:${timestamp}:${uniqueId}`
}

export function generateCaptureStepListKey(taskId: TaskIdentity): string {
  return `${taskId}:steps`
}

export function generateCaptureStepKey(
  taskId: TaskIdentity,
  stepId: string,
): StepIdentity {
  return `${taskId}:step-${stepId}`
}

export function isCaptureTaskKey(key: string): key is TaskIdentity {
  return /^capture:[0-9]{12}:[0-9a-f]{10}$/.test(key)
}
