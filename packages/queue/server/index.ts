import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"

const app = new Hono()
app.use("/*", cors())
app.use("/*", timeout(1000 * 60 * 1)) // 1 minutes

app.get("/", (c) => {
  return c.json({
    message: "Hello, world!",
  })
})

serve({
  port: parseInt(process.env["PORT"] || "3001"),
  fetch: app.fetch,
})
