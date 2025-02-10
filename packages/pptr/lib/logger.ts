import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import pino from "pino"

import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("../logs", import.meta.url))
if (!existsSync(dir)) {
  mkdirSync(dir)
}
const filePath = join(dir, `pptr.log`)

const level =
  process.env["LOG_LEVEL"] ||
  (process.env["NODE_ENV"] === "development" ? "debug" : "info")

const logger = pino({
  level,
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
      {
        target: "pino/file",
        options: {
          destination: filePath,
          makeDir: true,
        },
      },
    ],
  },
})

export default logger
