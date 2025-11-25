import { createLogger, format, transports } from "winston"
import { env } from "../env"

const DEV = env.NODE_ENV === "development"

const logDir = new URL("../../logs", import.meta.url).pathname
const combinedLogPath = `${logDir}/combined.log`
const errorLogPath = `${logDir}/error.log`

const level = env.LOG_LEVEL || (DEV ? "debug" : "info")
const sizeLimit = 50 * 1024 * 1024 // 50MB

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.json(),
    format.errors({ stack: true }),
  ),
  transports: [
    new transports.File({
      filename: combinedLogPath,
      maxsize: sizeLimit,
    }),
    new transports.File({
      filename: errorLogPath,
      level: "error",
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
