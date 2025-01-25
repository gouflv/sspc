import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import pino from "pino"

import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("../logs", import.meta.url))
if (!existsSync(dir)) {
  mkdirSync(dir)
}
const filePath = join(dir, `pptr.log`)

const logger = pino({
  level: process.env["LOG_LEVEL"] || "info",
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
