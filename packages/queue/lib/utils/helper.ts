import { countBy, omit } from "lodash-es"
import Progress from "../entities/progress"
import Task from "../entities/task"
import { CaptureJobPayload, CaptureTask, TaskInfo } from "../types"

export async function getTaskInfo(id: string) {
  const task = await Task.findById(id)

  if (!task) {
    throw new Error(`[task] not found: ${id}`)
  }

  const progressRecords = await Progress.findAll(id)
  const statusCount = countBy(progressRecords, (it) => it.status)

  const info: TaskInfo = {
    ...task,
    progress: {
      total: task.params.pages.length,
      pending: statusCount["pending"] || 0,
      running: statusCount["running"] || 0,
      completed: statusCount["completed"] || 0,
      failed: statusCount["failed"] || 0,
    },
    children: progressRecords,
  }

  return info
}

export function createCaptureJobPayload(
  task: CaptureTask,
  index: number,
): CaptureJobPayload {
  return {
    taskId: task.id,
    index,
    params: {
      ...omit(task.params, "pages"),
      url: task.params.pages[index].url,
    },
  }
}
