import { captureParamsSchema, CaptureParamsType } from "@pptr/core"
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

export type Status = "pending" | "running" | "completed" | "failed" | "canceled"

/**
 * Task entity
 */
export type CaptureTask = {
  id: string
  params: QueueCaptureParamsType
  status: Status
  artifact: string | null
  error: string | null
  queueJobId: string | null
}

/**
 * Queue job payload
 */
export type CaptureJobPayload = {
  taskId: string
  index: number
  params: CaptureParamsType
}

/**
 * Job progress entity
 */
export type CaptureProgress = {
  id: string
  taskId: string
  index: number
  status: Status
  error: string | null
  artifact: string | null
  duration: number | null
}

export type TaskInfo = CaptureTask & {
  status: Status
  progress: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
  }
  children: CaptureProgress[]
}

export const CaptureTaskQueueName = "captureTaskQueue"
export const CaptureJobQueueName = "captureJobQueue"
