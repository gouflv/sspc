import { afterEach, beforeEach, expect, it } from "vitest"
import { CaptureJob } from "../lib/classes/CaptureJob"
import { QueueCaptureInputParamsType } from "../lib/types"

const mockParams: QueueCaptureInputParamsType = {
  pages: [
    {
      url: "https://example.com",
      name: "example",
    },
  ],
}

let job: CaptureJob

beforeEach(async () => {
  job = await CaptureJob.create(mockParams)
})

afterEach(async () => {
  if (job) {
    await job.remove()
  }
})

it("should create a job with default values", async () => {
  expect(job.id).toBeDefined()
  expect(job.params).toEqual(mockParams)
  expect(job.status).toBe("pending")
  expect(job.artifact).toBeNull()
  expect(job.error).toBeNull()
  expect(job.queueJobId).toBeNull()
})

it("should generate unique ids for different jobs", async () => {
  const job2 = await CaptureJob.create(mockParams)
  expect(job2.id).not.toBe(job.id)
  await job2.remove()
})

it("should find job by id", async () => {
  const found = await CaptureJob.findById(job.id)
  expect(found).toBeDefined()
  expect(found?.id).toBe(job.id)
  expect(found?.params).toEqual(job.params)
})

it("should return null for non-existent job", async () => {
  const found = await CaptureJob.findById("non-existent-id")
  expect(found).toBeNull()
})

it("should update job properties", async () => {
  await job.update({
    status: "running",
    queueJobId: "test-job-id",
    artifact: "test-artifact",
    error: "test-error",
  })

  const updated = await CaptureJob.findById(job.id)
  expect(updated?.status).toBe("running")
  expect(updated?.queueJobId).toBe("test-job-id")
  expect(updated?.artifact).toBe("test-artifact")
  expect(updated?.error).toBe("test-error")
})

it("should confirm job existence", async () => {
  expect(await job.exists()).toBe(true)
})

it("should confirm job non-existence after removal", async () => {
  await job.remove()
  expect(await job.exists()).toBe(false)
})

it("should correctly serialize and deserialize job", async () => {
  const json = job.serialize()
  const deserialized = CaptureJob.fromJSON(json)

  expect(deserialized.id).toBe(job.id)
  expect(deserialized.params).toEqual(job.params)
  expect(deserialized.status).toBe(job.status)
  expect(deserialized.artifact).toBe(job.artifact)
})
