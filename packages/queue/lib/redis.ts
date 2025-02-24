import Redis from "ioredis"

export const RedisURL = process.env.REDIS_URL || "redis://localhost:6379"
export const client = new Redis(RedisURL)

export default {
  client,
}
