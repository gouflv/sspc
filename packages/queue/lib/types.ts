import { captureParamsSchema } from "@sspc/core"
import { z } from "zod"

//
// QueueCaptureParamsType
//
export const queueCaptureParamsSchema = captureParamsSchema.extend({
  pdfCompress: z.boolean().optional(),
})
export type QueueCaptureInputParamsType = z.input<
  typeof queueCaptureParamsSchema
>
export type QueueCaptureParamsType = z.infer<typeof queueCaptureParamsSchema>

export type Status =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

//
// Unique identifiers for entities
//
export type TaskIdentity = `capture:${string}:${string}`
export type StepIdentity = `${TaskIdentity}:step-${string}`

//
// Workers
//
export type QueueWorkerNames = "root" | "capture" | "compress"

export type WorkerResult = {
  step: StepIdentity
  artifact: Artifact
}

export type Artifact = {
  contentType: string
  filename: string
  size: number
}
