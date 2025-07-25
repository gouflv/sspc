import { serve } from "@hono/node-server"
import { d } from "@sspc/core"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import { env } from "../lib/env"
import jobs from "./routes/jobs"

// Setups
// import "../lib/events"
import "../lib/workers"

const app = new Hono()

app.use("/*", timeout(d("5 mins")))
app.use("*", cors())

app.get("/", (c) => {
  return c.text("Hello, world!")
})

app.route("/jobs", jobs)

// Setup bull-board
// setupBullBoard(app)

serve(
  {
    port: env.PORT,
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on ${info.port}`)
  },
)
