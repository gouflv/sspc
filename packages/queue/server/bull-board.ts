import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { HonoAdapter } from "@bull-board/hono"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import QueueMan from "../lib/queueMan"

export function setupBullBoard(app: Hono, path = "/ui") {
  const serverAdapter = new HonoAdapter(serveStatic)
  createBullBoard({
    queues: [
      new BullMQAdapter(QueueMan.queue.root),
      new BullMQAdapter(QueueMan.queue.capture),
      new BullMQAdapter(QueueMan.queue.compress),
    ],
    serverAdapter,
  })
  serverAdapter.setBasePath(path)
  app.route(path, serverAdapter.registerPlugin())
}
