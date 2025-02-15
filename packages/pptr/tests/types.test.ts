import { captureParamsSchema } from "@pptr/core"
import { expect, it } from "vitest"

it("should validate correct parameters", () => {
  const valid = {
    url: "https://example.com",
    viewportWidth: 1920,
    viewportHeight: 1080,
    quality: 80,
  }

  const result = captureParamsSchema.parse(valid)
  expect(result).toEqual(valid)
})

it("should reject invalid url", () => {
  expect(() => captureParamsSchema.parse({ url: "not-a-url" })).toThrow()
})

it("should reject negative numbers", () => {
  expect(() =>
    captureParamsSchema.parse({
      url: "https://example.com",
      viewportWidth: -100,
    }),
  ).toThrow()

  expect(() =>
    captureParamsSchema.parse({
      url: "https://example.com",
      quality: -1,
    }),
  ).toThrow()
})

it("should validate quality range", () => {
  expect(() =>
    captureParamsSchema.parse({
      url: "https://example.com",
      quality: 101,
    }),
  ).toThrow()
})

it("should accept valid pdf margins", () => {
  const valid = {
    url: "https://example.com",
    pdfMargin: {
      top: 10,
      right: "2cm",
      bottom: 20,
      left: "1.5in",
    },
  }

  expect(() => captureParamsSchema.parse(valid)).not.toThrow()
})

it("should reject negative pdf margins", () => {
  expect(() =>
    captureParamsSchema.parse({
      url: "https://example.com",
      pdfMargin: { top: -10 },
    }),
  ).toThrow()
})
