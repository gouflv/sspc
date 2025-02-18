import parseDuration from "parse-duration"

export const d = (duration: string) => {
  const ms = parseDuration(duration)
  if (ms === null) {
    throw new Error(`Invalid duration: ${duration}`)
  }
  return ms
}
