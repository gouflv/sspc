import mime from "mime"
import { createReadStream, createWriteStream } from "node:fs"
import { access, mkdir, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { Stream } from "node:stream"
import logger from "./logger"

function resolveFilePath(filename: string) {
  const base = new URL("../../data", import.meta.url).pathname
  return join(base, filename)
}

async function save(stream: Stream.Readable, filename: string) {
  const path = resolveFilePath(filename)
  try {
    await mkdir(dirname(path), { recursive: true })
  } catch (error) {
    logger.error("[artifact] failed to prepare directory", {
      path: dirname(path),
      error,
    })
    throw error
  }

  return new Promise<{
    path: string
    size: number
  }>((resolve, reject) => {
    const writer = createWriteStream(path)

    // Handle stream errors
    stream.on("error", async (error) => {
      logger.error("[artifact] stream error", { error })
      writer.end()
      await remove(filename)
      reject(error)
    })

    stream.pipe(writer)

    writer.on("finish", () => {
      logger.debug("[artifact] saved", { path })
      resolve({
        path,
        size: writer.bytesWritten,
      })
    })

    writer.on("error", async (error) => {
      logger.error("[artifact] write error", { error })
      await remove(filename)
      reject(error)
    })
  })
}

async function remove(filename: string) {
  logger.debug("[artifact] remove", { filename })
  const path = resolveFilePath(filename)

  try {
    await access(path)
  } catch (err) {
    return
  }

  try {
    await rm(path)
    logger.debug("[artifact] successfully removed", { path })
  } catch (error) {
    logger.error("[artifact] failed to remove", {
      filename,
      path,
      error,
    })
  }
}

async function createResponse(jobId: string) {
  const job = await CaptureJob.findById(jobId)

  if (!job?.artifact) {
    throw new Error("artifact not found")
  }

  const path = resolveFilePath(job.artifact)

  try {
    await access(path)
  } catch (err) {
    throw new Error(`artifact not found: ${path}`)
  }

  const stream = createReadStream(path)

  return new Response(stream, {
    headers: {
      "content-type": mime.getType(path) || "application/zip",
    },
  })
}

const Artifact = {
  save,
  remove,
  createResponse,
  resolveFilePath,
}
export default Artifact
