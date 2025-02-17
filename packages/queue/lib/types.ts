import { captureParamsSchema } from "@pptr/core"
import { z } from "zod"

export const queueCaptureParamsSchema = captureParamsSchema
  .omit({ url: true })
  .extend({
    //
    pages: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1),
        }),
      )
      .min(1),
  })

export type QueueCaptureInputParamsType = z.input<
  typeof queueCaptureParamsSchema
>

export type QueueCaptureParamsType = z.infer<typeof queueCaptureParamsSchema>

export type Status = "pending" | "running" | "completed" | "failed"

export type TaskData = {
  id: string
  params: QueueCaptureParamsType
  status: Status
  artifact: string | null
}

export type JobData = {
  id: string
  taskId: string
  index: number
  status: Status
  error: string | null
  artifact: string | null
}

export type TaskInfo = TaskData & {
  status: Status
  job: {
    total: number
    completed: number
    list: JobData[]
  }
}
