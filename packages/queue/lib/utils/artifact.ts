import archiver from "archiver"
import mime from "mime"
import { createReadStream, createWriteStream, unlink } from "node:fs"
import { mkdir } from "node:fs/promises"
import { dirname, extname, join } from "node:path"
import { Stream } from "node:stream"
import { CaptureJob } from "../classes/job"
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
  const path = resolveFilePath(filename)
  return new Promise<void>((resolve, reject) => {
    unlink(path, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function geReadStream(filename: string) {
  const path = resolveFilePath(filename)
  return createReadStream(path)
}

async function createResponse(jobId: string) {
  const job = await CaptureJob.findById(jobId)
  if (!job?.artifact) {
    throw new Error("artifact not found")
  }

  const isPackage = job.artifact.endsWith(".zip")
  const stream = await geReadStream(job.artifact)
  const fileName = isPackage
    ? job.artifact
    : replaceFilename(job.artifact, job.params.pages[0].name)

  return new Response(stream, {
    headers: {
      "content-type": mime.getType(job.artifact) || "application/zip",
      "content-disposition": `attachment; filename="${fileName}"`,
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
