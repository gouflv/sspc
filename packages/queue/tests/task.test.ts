import { expect, test } from "vitest"
import { Task } from "../lib/task"
import { QueueCaptureParamsType } from "../lib/types"

const mockParams: QueueCaptureParamsType = {
  pages: [
    {
      url: "https://example.com",
      name: "title",
    },
  ],
}

test("should create task", async () => {
  const task = await Task.create(mockParams)

  // Verify task instance
  expect(task).toBeInstanceOf(Task)
  expect(task.id).toBeDefined()
  expect(task.status).toBe("pending")
  expect(task.params).toEqual(mockParams)

  // console.log("task", JSON.stringify(task, null, 2))

  // Verify persistence
  const exists = await task.exists()
  expect(exists).toBe(true)

  // Verify retrieval
  const retrieved = await Task.fromId(task.id!)
  expect(retrieved).not.toBeNull()

  // Clean up
  await task.delete()
})

test("should update task status", async () => {
  const task = await Task.create(mockParams)

  // Test status update
  await task.updateStatus("running")
  expect(task.status).toBe("running")

  // Verify persistence
  const retrieved = await Task.fromId(task.id!)
  expect(retrieved?.status).toBe("running")

  // Test error on non-existent task
  await task.delete()
  await expect(task.updateStatus("completed")).rejects.toThrow(
    "Task does not exist",
  )
})

test("should handle toData correctly", () => {
  const task = new Task()

  // Should throw error when id is missing
  expect(() => task.toData()).toThrow("Task is missing id")

  // Should throw error when params is missing
  task.id = "test:id"
  expect(() => task.toData()).toThrow("Task is missing params")

  // Should return correct data structure when all required fields are present
  task.params = mockParams
  const data = task.toData()
  expect(data).toEqual({
    id: "test:id",
    params: mockParams,
    status: "pending",
  })
})
