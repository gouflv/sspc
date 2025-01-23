import { expect, it } from "vitest";
import { captureParams } from "../lib/types";

it("should validate correct parameters", () => {
  const valid = {
    url: "https://example.com",
    viewportWidth: 1920,
    viewportHeight: 1080,
    quality: 80,
  };

  const result = captureParams.parse(valid);
  expect(result).toEqual({
    ...valid,
    captureFormat: "png", // default value
  });
});

it("should reject invalid url", () => {
  expect(() => captureParams.parse({ url: "not-a-url" })).toThrow();
});

it("should reject negative numbers", () => {
  expect(() =>
    captureParams.parse({
      url: "https://example.com",
      viewportWidth: -100,
    })
  ).toThrow();

  expect(() =>
    captureParams.parse({
      url: "https://example.com",
      quality: -1,
    })
  ).toThrow();
});

it("should validate quality range", () => {
  expect(() =>
    captureParams.parse({
      url: "https://example.com",
      quality: 101,
    })
  ).toThrow();
});

it("should accept valid pdf margins", () => {
  const valid = {
    url: "https://example.com",
    pdfMargin: {
      top: 10,
      right: "2cm",
      bottom: 20,
      left: "1.5in",
    },
  };

  expect(() => captureParams.parse(valid)).not.toThrow();
});

it("should reject negative pdf margins", () => {
  expect(() =>
    captureParams.parse({
      url: "https://example.com",
      pdfMargin: { top: -10 },
    })
  ).toThrow();
});

it("should apply default captureFormat", () => {
  const result = captureParams.parse({
    url: "https://example.com",
  });

  expect(result.captureFormat).toBe("png");
});
