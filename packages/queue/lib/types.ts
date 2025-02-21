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
 * queue job data for capture task
 */
export type CaptureTaskQueueJobData = {
  jobId: string
  index: number
  params: CaptureParamsType
}

export const PackageQueueName = "packageQueue"
export const CaptureQueueName = "captureQueue"
