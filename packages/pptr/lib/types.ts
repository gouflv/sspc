import { type } from "arktype";

export const captureParams = type({
  viewportWidth: "number?",
  viewportHeight: "number?",

  url: "string",
  captureFormat: "'png'|'jpeg'|'pdf'?",
  timeout: "number?",

  quality: "number?",
  captureElementSelector: "string?",

  pdfFormat: "string?",
  "pdfMargin?": {
    top: "number|string?",
    right: "number|string?",
    bottom: "number|string?",
    left: "number|string?",
  },
  pdfWidth: "number?",
  pdfHeight: "number?",
});

export type CaptureParamsType = typeof captureParams.infer;
