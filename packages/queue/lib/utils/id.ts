import dayjs from "dayjs"
import { customAlphabet } from "nanoid"
import { CaptureJobId, CaptureTaskId } from "../types"

const nanoid = customAlphabet("1234567890abcdef", 10)

export function generateJobId(): CaptureJobId {
  const timestamp = dayjs().format("YY-MM-DD-HH-mm-ss".replace(/-/g, ""))
  const uniqueId = nanoid()
  return `job:${timestamp}:${uniqueId}`
}

export function generateTaskId(
  jobId: CaptureJobId,
  taskId: number,
): CaptureTaskId {
  return `${jobId}:task-${taskId}`
}

export function isCaptureJobId(id: string): id is CaptureJobId {
  return /^job:[0-9]{12}:[0-9a-f]{10}$/.test(id)
}

export function isCaptureTaskId(id: string): id is CaptureTaskId {
  return /^job:[0-9]{12}:[0-9a-f]{10}:task-[0-9]+$/.test(id)
}
