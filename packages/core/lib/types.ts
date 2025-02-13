import { z } from "zod"

export const captureParamsSchema = z.object({
  url: z.string().url(),

  viewportWidth: z.number().positive().optional(),
  viewportHeight: z.number().positive().optional(),
  timeout: z.number().positive().optional(),

  captureFormat: z.enum(["png", "jpeg", "pdf"]).default("png"),
  quality: z.number().min(0).max(100).optional(),
  captureElementSelector: z.string().optional(),

  pdfFormat: z.string().optional(),
  pdfMargin: z
    .object({
      top: z.union([z.number().min(0), z.string()]).optional(),
      right: z.union([z.number().min(0), z.string()]).optional(),
      bottom: z.union([z.number().min(0), z.string()]).optional(),
      left: z.union([z.number().min(0), z.string()]).optional(),
    })
    .optional(),
  pdfWidth: z.number().positive().optional(),
  pdfHeight: z.number().positive().optional(),
})

export type CaptureParamsType = z.infer<typeof captureParamsSchema>
