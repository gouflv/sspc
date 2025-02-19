import { omit } from "lodash-es"
import { CaptureJobPayload, CaptureTask, TaskInfo } from "../types"
import Task from "../entities/task"
import jobProgress from "../entities/progress"

export async function getTaskInfo(id: string) {
  const task  = await Task.findById(id)
  
  if (!task) {
    throw new Error("Task not found")
  }
  
  const progressRecords = await jobProgress.findAll(id)

  const info: TaskInfo = {
   ...task,
   progress: {
      total: task.params.pages.length,
      current: progress,
    },
   } 
  }

  return info
}

export function createCaptureJobPayload(task: CaptureTask, index: number): CaptureJobPayload {
  return {
    taskId: task.id,
    index,
    params: {
      ...omit(task.params, "pages"),
      url: task.params.pages[index].url,
    },
  }
}
