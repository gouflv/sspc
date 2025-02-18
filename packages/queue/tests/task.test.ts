import { afterEach, expect, test } from "vitest"
import Task from "../lib/entities/task"
import { QueueCaptureInputParamsType } from "../lib/types"

let taskId: string

const mockParams: QueueCaptureInputParamsType = {
  pages: [
    {
      url: "https://example.com",
      name: "example",
    },
  ],
  timeout: 5000,
}

afterEach(async () => {
  // Cleanup any created tasks
  if (taskId) {
    await Task.remove(taskId)
  }
})

test("should create a new task", async () => {
  const task = await Task.create(mockParams)
  taskId = task.id

  expect(task).toMatchObject({
    id: expect.stringMatching(/^task:/),
    params: mockParams,
    artifact: null,
  })

  // Verify task was saved to Redis
  const exists = await Task.exists(task.id)
  expect(exists).toBe(true)
})

test("should find task by id", async () => {
  const task = await Task.create(mockParams)
  taskId = task.id

  const found = await Task.findById(task.id)
  expect(found).toEqual(task)
})

test("should return null when finding non-existent task", async () => {
  const found = await Task.findById("task:nonexistent")
  expect(found).toBeNull()
})

test("should update task artifact", async () => {
  const task = await Task.create(mockParams)
  taskId = task.id

  const artifact = "/tmp/screenshot.png" // Changed from object to string
  const updated = await Task.update(task.id, {
    artifact,
  })

  expect(updated).toMatchObject({
    id: task.id,
    artifact,
  })

  // Verify changes were persisted
  const found = await Task.findById(task.id)
  expect(found).toEqual(updated)
})

test("should throw error when updating non-existent task", async () => {
  await expect(
    Task.update("task:nonexistent", { artifact: "example" }),
  ).rejects.toThrow("Task not found")
})

test("should remove task", async () => {
  const task = await Task.create(mockParams)

  await Task.remove(task.id)

  const exists = await Task.exists(task.id)
  expect(exists).toBe(false)
})

test("should check if task exists", async () => {
  const task = await Task.create(mockParams)
  taskId = task.id

  expect(await Task.exists(task.id)).toBe(true)
  expect(await Task.exists("task:nonexistent")).toBe(false)
})
