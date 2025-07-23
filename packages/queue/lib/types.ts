import { captureParamsSchema } from "@pptr/core"
import { z } from "zod"

// QueueCaptureParamsType
export const queueCaptureParamsSchema = captureParamsSchema
export type QueueCaptureInputParamsType = z.input<
  typeof queueCaptureParamsSchema
>
export type QueueCaptureParamsType = z.infer<typeof queueCaptureParamsSchema>

export type Status = "pending" | "running" | "completed" | "failed" | "canceled"

// Keys
export type TaskKey = `capture:${string}:${string}`
export type StepKey = `${TaskKey}:step${string}`

// Worker Names
export type QueueWorkNames = "capture" | "compress"
