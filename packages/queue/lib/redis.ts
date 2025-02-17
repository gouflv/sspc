import Redis from "ioredis"

export const RedisURL = process.env.REDIS_URL || "redis://localhost:6379"
const client = new Redis(RedisURL)

async function getJSON<T>(key: string) {
  const data = await client.get(key)
  if (!data) {
    return null
  }
  return JSON.parse(data) as T
}

async function setJSON(
  key: string,
  data: unknown,
  options?: { expire?: number },
) {
  await client.set(key, JSON.stringify(data))
  if (typeof options?.expire === "number") {
    await client.expire(key, options.expire)
  }
}

async function exists(key: string) {
  return (await client.exists(key)) === 1
}

export default {
  client,
  getJSON,
  setJSON,
  exists,
  remove: client.del.bind(client),
  keys: client.keys.bind(client),
  expire: client.expire.bind(client),
}
