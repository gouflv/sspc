import parseDuration from "parse-duration"

export const d = (
  duration: `${number} ${
    | "m"
    | "h"
    | "d"
    | "w"
    | "m"
    | "y"
    | "min"
    | "mins"
    | "hour"
    | "hours"
    | "day"
    | "days"
    | "week"
    | "weeks"
    | "month"
    | "months"
    | "year"
    | "years"}`,
) => {
  const ms = parseDuration(duration)
  if (ms === null) {
    throw new Error(`Invalid duration: ${duration}`)
  }
  return ms
}
