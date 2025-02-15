import Redis from "ioredis"

const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

async function getJSON<T>(key: string) {
  const data = await client.get(key)
  if (!data) {
    return null
  }
  return JSON.parse(data) as T
}

async function setJSON(key: string, data: unknown) {
  await client.set(key, JSON.stringify(data))
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
}
