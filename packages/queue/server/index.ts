import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"
import { getRedisClient } from "../lib/redis"

const app = new Hono()
app.use("/*", cors())
app.use("/*", timeout(1000 * 60 * 1)) // 1 minutes

app.get("/", (c) => {
  return c.json({
    message: "Hello, world!",
  })
})

// create task
app.post("/task", (c) => {
  return c.json({
    id: "123",
  })
})

// check status
app.get("/task/:id", (c) => {
  return c.json({
    status: "pending",
  })
})

// get artifact
app.get("/task/:id/artifact", (c) => {
  return new Response()
})

serve(
  {
    port: parseInt(process.env["PORT"] || "3001"),
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on ${info.port}`)

    getRedisClient()
  },
)
