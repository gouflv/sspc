import mime from "mime"
import { createReadStream, createWriteStream } from "node:fs"
import { access, glob, mkdir, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { Stream } from "node:stream"
import { Artifact, TaskIdentity } from "../types"
import { toFilename } from "./file"
import logger from "./logger"

const BasePath = new URL("../../data", import.meta.url).pathname

function getFilePath(filename: string) {
  return join(BasePath, filename)
}

async function save(stream: Stream.Readable, filename: string) {
  const path = getFilePath(filename)
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
  const path = getFilePath(filename)

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

async function removeByPattern(taskKey: TaskIdentity) {
  try {
    const filesIterator = glob(`${toFilename(taskKey)}*`, {
      cwd: BasePath,
    })
    for await (const file of filesIterator) {
      await remove(file)
    }
  } catch (error) {
    logger.error("[artifact] removeByPattern", { task: taskKey, error })
  }
}

async function createResponse(artifact: Artifact) {
  const path = getFilePath(artifact.filename)

  try {
    await access(path)
  } catch (err) {
    throw new Error("File not found")
  }

  const stream = createReadStream(path)
  return new Response(stream, {
    headers: {
      "Content-Type":
        artifact.contentType ||
        mime.getType(artifact.filename) ||
        "application/octet-stream",
      "Content-Length": String(artifact.size),
    },
  })
}

const Artifact = {
  save,
  remove,
  removeByTaskKey: removeByPattern,
  createResponse,
  resolveFilePath: getFilePath,
}
export default Artifact
