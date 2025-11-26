import { serve } from "@hono/node-server"
import { d } from "@sspc/core"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import { env } from "../lib/env"
import { setupBullBoard } from "./bull-board"
import jobs from "./routes/jobs"

// Setups
import "../lib/events"
import QueueMan from "../lib/queueMan"
import "../lib/workers"

const app = new Hono()

app.use("/*", timeout(d("5 mins")))
app.use("*", cors())
app.use("*", async (c, next) => {
  await next()
  c.header("sspc-node", env.NODE_NAME || "default")
})

app.get("/", (c) => {
  return c.text("Hello, world!")
})

app.route("/jobs", jobs)

app.get("/health", async (c) => {
  const root = QueueMan.queue.root
  const wait = await root.getWaitingChildrenCount()
  return c.json({
    success: true,
    data: { wait },
  })
})

setupBullBoard(app)

serve(
  {
    port: env.PORT,
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on ${info.port}`)
  },
)
