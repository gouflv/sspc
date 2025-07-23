import dayjs from "dayjs"
import { customAlphabet } from "nanoid"
import { TaskKey } from "../types"

const nanoid = customAlphabet("1234567890abcdef", 10)

export function generateCaptureTaskKey(): TaskKey {
  const timestamp = dayjs().format("YY-MM-DD-HH-mm-ss".replace(/-/g, ""))
  const uniqueId = nanoid()
  return `capture:${timestamp}:${uniqueId}`
}

export function generateCaptureStepListKey(taskKey: TaskKey): string {
  return `${taskKey}:steps`
}

export function generateCaptureStepKey(
  taskId: TaskKey,
  stepId: string,
): TaskKey {
  return `${taskId}:step-${stepId}`
}

export function isCaptureTaskKey(key: string): key is TaskKey {
  return /^capture:[0-9]{12}:[0-9a-f]{10}$/.test(key)
}
