import { createLogger, format, transports } from "winston"

const file = new URL("../logs/pptr.log", import.meta.url).pathname

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
      filename: file,
      maxsize: 10 * 1024 * 1024, // 10MB
    }),
  ],
})

export default logger
