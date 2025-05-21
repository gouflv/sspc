import { serve } from "@hono/node-server"
import { d } from "@pptr/core"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import { pick } from "lodash-es"
import logger from "../lib/utils/logger"
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

// Setups
import "../lib/events"
import "../lib/workers"

const app = new Hono()

app.use("/*", timeout(d("5 mins")))
app.use("*", cors())

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
