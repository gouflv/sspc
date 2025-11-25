import { createLogger, format, transports } from "winston"
import { env } from "./env"

const DEV = env.NODE_ENV === "development"

const logPath = new URL("../logs/pptr.log", import.meta.url).pathname

const level = env.LOG_LEVEL || (DEV ? "debug" : "info")
const sizeLimit = 50 * 1024 * 1024 // 50MB

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.json(),
  ),
  transports: [
    new transports.File({
      filename: logPath,
      maxsize: sizeLimit,
    }),
    ...(DEV
      ? [
          new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
          }),
        ]
      : []),
  ],
})

export default logger
