import { createLogger, format, transports } from "winston"
import { env } from "../env"

const logDir = new URL("../../logs", import.meta.url).pathname
const combinedLogPath = `${logDir}/combined.log`
const errorLogPath = `${logDir}/error.log`

const level = env.NODE_ENV === "development" ? "debug" : env.LOG_LEVEL

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
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: combinedLogPath,
      maxsize: 10 * 1024 * 1024, // 10MB
    }),
    new transports.File({
      filename: errorLogPath,
      level: "error",
      maxsize: 10 * 1024 * 1024, // 10MB
    }),
  ],
})

export default logger
