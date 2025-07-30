import { z } from "zod"

export const captureParamsSchema = z.object({
  //
  // Basic
  //

  url: z.url(),

  captureFormat: z.enum(["png", "jpeg", "pdf"]).optional(),

  /**
   * Sets quality for JPEG images.
   */
  quality: z.number().min(0).max(100).optional(),

  /**
   * Sets selector for capturing a specific element.
   */
  captureElementSelector: z.string().optional(),

  //
  // Browser
  //

  headers: z.record(z.string(), z.string()).optional(),

  userAgent: z
    .union([
      z.string(),
      z.object({
        deviceCategory: z.enum(["desktop", "mobile"]),
      }),
    ])
    .optional(),

  cookies: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        domain: z.string(),
      }),
    )
    .optional(),

  viewport: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),

  //
  // Timing
  //

  readySelector: z.string().optional(),

  waitFor: z
    .object({
      selector: z.string(),
      timeout: z.number().positive().optional(),
    })
    .optional(),

  /**
   * Sets timeout in milliseconds for: page.defaultTimeout(), page.defaultNavigationTimeout()
   */
  timeout: z.number().positive().optional(),

  //
  // PDF specific options
  //

  pdfFormat: z.string().optional(),

  pdfMargin: z
    .object({
      top: z.union([z.number(), z.string()]).optional(),
      right: z.union([z.number(), z.string()]).optional(),
      bottom: z.union([z.number(), z.string()]).optional(),
      left: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),

  pdfWidth: z.number().positive().optional(),

  pdfHeight: z.number().positive().optional(),
})

export type CaptureParamsType = z.infer<typeof captureParamsSchema>
