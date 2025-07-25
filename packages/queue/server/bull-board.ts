import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { HonoAdapter } from "@bull-board/hono"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import QueueMan from "../lib/queue"

export function setupBullBoard(app: Hono, path = "/ui") {
  const serverAdapter = new HonoAdapter(serveStatic)
  createBullBoard({
    queues: [
      new BullMQAdapter(QueueMan.captureQueue),
      new BullMQAdapter(QueueMan.packageQueue),
    ],
    serverAdapter,
  })
  serverAdapter.setBasePath(path)
  app.route(path, serverAdapter.registerPlugin())
}
