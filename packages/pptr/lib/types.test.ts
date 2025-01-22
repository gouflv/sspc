import { type } from "arktype";
import { expect, it } from "vitest";
import { captureParams } from "./types";

it("should validate complete valid params", () => {
  const input = {
    url: "https://example.com",
    viewportWidth: 1024,
    viewportHeight: 768,
    captureFormat: "pdf",
    quality: 90,
    pdfFormat: "A4",
    pdfMargin: {
      top: 10,
      right: "20px",
      bottom: 10,
      left: "20px",
    },
  };

  const result = captureParams(input);
  expect(result instanceof type.errors).toBe(false);
  if (!(result instanceof type.errors)) {
    expect(result).toEqual(input);
  }
});

it("should validate minimal required params", () => {
  const input = {
    url: "https://example.com",
  };

  const result = captureParams(input);
  expect(result instanceof type.errors).toBe(false);
  if (!(result instanceof type.errors)) {
    expect(result).toEqual(input);
  }
});

it("should provide error details for invalid data", () => {
  const cases = [
    {
      input: { url: 123 },
      expectedError: "url",
    },
    {
      input: { url: "https://example.com", captureFormat: "gif" },
      expectedError: "captureFormat",
    },
    {
      input: { url: "https://example.com", quality: "high" },
      expectedError: "quality",
    },
    {
      input: { viewportWidth: "1024" },
      expectedError: "url",
    },
  ];

  cases.forEach(({ input, expectedError }) => {
    const result = captureParams(input);
    expect(result instanceof type.errors).toBe(true);
    if (result instanceof type.errors) {
      console.log(result.summary);
      expect(result.summary).toContain(expectedError);
    }
  });
});
