import { afterEach, expect, test } from "vitest"
import Job from "../lib/job"
import { TaskData } from "../lib/types"

let jobIds: string[] = []

const mockTask: TaskData = {
  id: "task:test",
  params: {
    pages: [
      { url: "https://example.com/1", name: "page1" },
      { url: "https://example.com/2", name: "page2" },
    ],
  },
  status: "pending",
  artifact: null,
}

afterEach(async () => {
  // Cleanup jobs
  if (jobIds.length) {
    await Promise.all(jobIds.map((id) => Job.remove(id)))
    jobIds = []
  }
})

test("should create jobs from task", async () => {
  const jobs = await Job.createByTask(mockTask)
  jobIds = jobs.map((j) => j.id)

  expect(jobs).toHaveLength(2)
  expect(jobs[0]).toMatchObject({
    id: `${mockTask.id}:job-0`,
    taskId: mockTask.id,
    index: 0,
    status: "pending",
    error: null,
    artifact: null,
  })

  // Verify jobs were saved to Redis
  const savedJob = await Job.findById(jobs[0].id)
  expect(savedJob).toEqual(jobs[0])
})

test("should find job by id", async () => {
  const jobs = await Job.createByTask(mockTask)
  jobIds = jobs.map((j) => j.id)

  let found = await Job.findById(jobs[0].id)
  expect(found).toEqual(jobs[0])

  found = await Job.findById(jobs[1].id)
  expect(found).toEqual(jobs[1])
})

test("should return null when finding non-existent job", async () => {
  const found = await Job.findById("task:test:job-999")
  expect(found).toBeNull()
})

test("should find all jobs by task", async () => {
  const jobs = await Job.createByTask(mockTask)
  jobIds = jobs.map((j) => j.id)

  const found = await Job.findAllByTask(mockTask.id)
  expect(found).toHaveLength(2)
  expect(found).toEqual(expect.arrayContaining(jobs))
})

test("should update job status, error and artifact", async () => {
  const jobs = await Job.createByTask(mockTask)
  jobIds = jobs.map((j) => j.id)

  await Job.update(jobs[0].id, {
    status: "completed",
    error: null,
    artifact: "/tmp/screenshot.png",
  })

  const updated = await Job.findById(jobs[0].id)
  expect(updated).toMatchObject({
    status: "completed",
    error: null,
    artifact: "/tmp/screenshot.png",
  })
})

test("should throw error when updating non-existent job", async () => {
  await expect(
    Job.update("task:test:job-999", { status: "completed" }),
  ).rejects.toThrow("Job not found")
})

test("should remove all jobs by task", async () => {
  const jobs = await Job.createByTask(mockTask)
  jobIds = jobs.map((j) => j.id)

  await Job.removeAllByTask(mockTask.id)

  const found = await Job.findAllByTask(mockTask.id)
  expect(found).toHaveLength(0)
})

test("should generate correct job keys", async () => {
  const jobs = await Job.createByTask(mockTask)
  jobIds = jobs.map((j) => j.id)

  expect(jobs[0].id).toBe(`${mockTask.id}:job-0`)
  expect(jobs[1].id).toBe(`${mockTask.id}:job-1`)
})
