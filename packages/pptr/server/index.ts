import { arktypeValidator as validate } from "@hono/arktype-validator";
import to from "await-to-js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { timeout } from "hono/timeout";
import { defaults } from "lodash-es";
import capture from "../lib/capture";
import logger from "../lib/logger";
import { captureParams, type CaptureParamsType } from "../lib/types";

const app = new Hono();
app.use("/*", cors());
app.use("/*", timeout(1000 * 60 * 5)); // 5 minutes

app.get("/", (c) => {
  return c.json({
    message: "Hello, world!",
  });
});

app.post("/capture", validate("json", captureParams), async (c) => {
  const params = await c.req.json<CaptureParamsType>();

  defaults(params, { captureFormat: "png" });

  const requestId = c.req.header("Request-ID");
  if (requestId) {
    c.res.headers.set("Request-ID", requestId);
  }

  logger.info(
    {
      requestId,
      request: { params },
    },
    "/capture"
  );

  const startTime = Date.now();
  const [error, captureResult] = await to(capture(params));
  const duration = Date.now() - startTime;

  if (error) {
    logger.error(
      {
        requestId,
        error: error.message,
      },
      "/capture"
    );
    return c.json({
      success: false,
      error: error.message,
    });
  }

  logger.info(
    {
      requestId,
      duration,
    },
    "/capture success"
  );

  c.res.headers.set(
    "Content-Disposition",
    `attachment; filename=capture.${params.captureFormat}`
  );
  return new Response(captureResult.data.buffer as ArrayBuffer);
});

export default {
  port: parseInt(process.env["PORT"] || "3000"),
  fetch: app.fetch,
};
