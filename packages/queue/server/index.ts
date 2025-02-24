import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { setupBullBoard } from "./bull-board"
import jobs from "./routes/jobs"

logger.info(
  "Environment",
  pick(process.env, [
    "NODE_ENV",
    "HONO_PORT",
    "REDIS_URL",
    "JOB_EXPIRE",
    "JOB_ATTEMPTS",
    "CAPTURE_ENDPOINT",
    "CAPTURE_CONCURRENCY",
  ]),
)

// Setup bullmq
import { pick } from "lodash-es"
import "../lib/events"
import logger from "../lib/utils/logger"
import "../lib/workers"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello, world!")
})

app.route("/jobs", jobs)

// Setup bull-board
setupBullBoard(app)

serve(
  {
    port: parseInt(process.env["PORT"] || "3001"),
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on ${info.port}`)
  },
)
