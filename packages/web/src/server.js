import { serve } from "@hono/node-server"
import { Hono } from "hono"

const app = new Hono()
app.get("/", (c) => c.text("Hello Node.js!"))

serve({
  port: 3002,
  fetch: app.fetch,
})
