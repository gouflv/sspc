import Redis from "ioredis"
;(async () => {
  const client = new Redis()

  await client.set("foo", "bar")
  await client.set("foo", "baz")

  const result = await client.get("foo")
  console.log(result)

  const noFound = await client.hgetall("foo2")
  console.log(noFound)

  client.disconnect()
})()
