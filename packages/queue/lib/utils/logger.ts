import { createLogger, format, transports } from "winston"

const logDir = new URL("../../logs", import.meta.url).pathname
const combinedLogPath = `${logDir}/combined.log`
const errorLogPath = `${logDir}/error.log`

const level =
  process.env["LOG_LEVEL"] ||
  (process.env["NODE_ENV"] === "development" ? "debug" : "info")

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.json(),
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
