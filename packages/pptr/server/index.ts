import { arktypeValidator as validate } from "@hono/arktype-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { captureParams, type CaptureParamsType } from "../lib/types";

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => {
  return c.json({
    message: "Hello, world!",
  });
});

app.post("/capture", validate("json", captureParams), async (c) => {
  const params = await c.req.json<CaptureParamsType>();
  return c.json({
    success: true,
    params,
  });
});

export default app;
