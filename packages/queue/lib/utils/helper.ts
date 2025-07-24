import dayjs from "dayjs"
import { TaskEntity } from "../entities/Task"
import redis from "../redis"

export function toFilename(id: string) {
  return id.replace(/[^A-Za-z0-9-_.]/g, "_")
}

export async function logTask(data: TaskEntity) {
  await redis.client.xadd(
    "job:logs",
    "*",
    "date",
    dayjs().format("YYYY-MM-DD HH:mm:ss"),
    "job",
    data.id,
    "params",
    JSON.stringify(data.params),
  )
}

export async function logCompletedJob(data: TaskEntity) {
  await redis.client.lpush("job:completed", data.id)
}
