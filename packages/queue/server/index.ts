import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { setupBullBoard } from "./bull-board"
import jobs from "./routes/jobs"

// Setup bullmq
import "../lib/events"
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
