import parseDuration from "parse-duration"

type DurationFormat = `${number} ${
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
  | "years"}`

export const d = (duration: DurationFormat, unit: "ms" | "s" = "ms") => {
  const ms = parseDuration(duration)
  if (ms === null) {
    throw new Error(`Invalid duration: ${duration}`)
  }
  return unit === "ms" ? ms : ms / 1000
}

export const ds = (duration: DurationFormat) => d(duration, "s")
