import archiver from "archiver"
import mime from "mime"
import { createReadStream, createWriteStream } from "node:fs"
import { access, mkdir, rm } from "node:fs/promises"
import { dirname, extname, join } from "node:path"
import { Stream } from "node:stream"
import logger from "./logger"

function resolveFilePath(filename: string) {
  const base = new URL("../../data", import.meta.url).pathname
  return join(base, filename)
}

async function save(stream: Stream, filename: string) {
  const path = resolveFilePath(filename)
  await mkdir(dirname(path), { recursive: true })

  return new Promise<string>((resolve, reject) => {
    const writer = createWriteStream(path)
    stream.pipe(writer)
    writer.on("finish", () => {
      logger.debug("[artifact] saved", { path })
      resolve(path)
    })
    writer.on("error", reject)
  })
}

async function packageArtifacts(
  artifacts: {
    filename: string
    distName: string
  }[],
  filename: string,
) {
  const path = resolveFilePath(filename)
  await mkdir(dirname(path), { recursive: true })

  const output = createWriteStream(path)
  const archive = archiver("zip", {
    zlib: { level: 9 },
  })

  return new Promise<string>((resolve, reject) => {
    output.on("close", () => {
      logger.debug("[artifact] packaged", { path })
      resolve(path)
    })

    archive.on("error", reject)

    archive.pipe(output)

    for (const artifact of artifacts) {
      archive.file(resolveFilePath(artifact.filename), {
        name: replaceFilename(artifact.filename, artifact.distName),
      })
    }

    archive.finalize()
  })
}

function replaceFilename(file: string, newName: string) {
  const ext = extname(file)
  const distNameBaseOnly = newName.replace(/\..+$/, "")
  return `${distNameBaseOnly}${ext}`
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
  } catch (err) {
    logger.error("[artifact] failed to remove", {
      filename,
      error: (err as Error).message,
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
  packageArtifacts,
  replaceFilename,
  createResponse,
}
export default Artifact
