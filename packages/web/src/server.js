import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"

const app = new Hono()

app.use("/*", serveStatic({ root: "../dist" }))
app.use("/static/*", serveStatic({ root: ".." }))

serve({
  port: 3002,
  fetch: app.fetch,
})
