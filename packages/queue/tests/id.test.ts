import { expect, it } from "vitest"
import {
  generateJobId,
  generateTaskId,
  isCaptureJobId,
  isCaptureTaskId,
} from "../lib/utils/id"

it("should generate job id in correct format", () => {
  const jobId = generateJobId()
  expect(typeof jobId).toBe("string")
  expect(isCaptureJobId(jobId)).toBe(true)
  expect(jobId).toMatch(/^job:[0-9]{12}:[0-9a-f]{10}$/)
})

it("should generate task id in correct format", () => {
  const jobId = generateJobId()
  const taskId = 1
  const taskIdStr = generateTaskId(jobId, taskId)

  expect(typeof taskIdStr).toBe("string")
  expect(isCaptureTaskId(taskIdStr)).toBe(true)
  expect(taskIdStr).toBe(`${jobId}:task-${taskId}`)
})

it("should generate multiple task ids with same job id", () => {
  const jobId = generateJobId()
  const taskId1 = generateTaskId(jobId, 1)
  const taskId2 = generateTaskId(jobId, 2)

  expect(taskId1).toBe(`${jobId}:task-1`)
  expect(taskId2).toBe(`${jobId}:task-2`)
})

it("should validate job ids correctly", () => {
  // Valid job ids
  expect(isCaptureJobId("job:220101123456:abc1234567")).toBe(true)
  expect(isCaptureJobId("job:210815092233:0123456789")).toBe(true)

  // Invalid job ids
  expect(isCaptureJobId("invalid")).toBe(false)
  expect(isCaptureJobId("job:123:abc")).toBe(false)
  expect(isCaptureJobId("job:220101123456:abc")).toBe(false) // ID too short
  expect(isCaptureJobId("task:220101123456:abc1234567")).toBe(false)
  expect(isCaptureJobId("")).toBe(false)
  expect(isCaptureJobId(null as any)).toBe(false)
  expect(isCaptureJobId(undefined as any)).toBe(false)
})

it("should validate task ids correctly", () => {
  // Valid task ids
  expect(isCaptureTaskId("job:220101123456:abc1234567:task-1")).toBe(true)
  expect(isCaptureTaskId("job:220101123456:abc1234567:task-123")).toBe(true)

  // Invalid task ids
  expect(isCaptureTaskId("job:220101123456:abc1234567")).toBe(false) // Missing task part
  expect(isCaptureTaskId("job:220101123456:abc1234567:subtask-1")).toBe(false)
  expect(isCaptureTaskId("job:220101123456:abc:task-1")).toBe(false) // Invalid job ID
  expect(isCaptureTaskId("job:220101123456:abc1234567:task-")).toBe(false) // Missing task number
  expect(isCaptureTaskId("")).toBe(false)
  expect(isCaptureTaskId(null as any)).toBe(false)
  expect(isCaptureTaskId(undefined as any)).toBe(false)
})
