import archiver from "archiver"
import { createReadStream, createWriteStream, unlink } from "node:fs"
import { mkdir } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import { Stream } from "node:stream"
import logger from "./logger"

function resolveFilePath(filename: string) {
  const base = new URL("../data", import.meta.url).pathname
  return join(base, filename)
}

async function save(stream: Stream, filename: string) {
  const path = resolveFilePath(filename)

  await mkdir(dirname(path), { recursive: true })

  return new Promise<string>((resolve, reject) => {
    const writer = createWriteStream(path)
    stream.pipe(writer)
    writer.on("finish", () => {
      logger.debug("Artifact saved", { path })
      resolve(path)
    })
    writer.on("error", reject)
  })
}

async function packageArtifacts(artifacts: string[], filename: string) {
  const path = resolveFilePath(filename)
  await mkdir(dirname(path), { recursive: true })

  const output = createWriteStream(path)
  const archive = archiver("zip", {
    zlib: { level: 9 },
  })

  return new Promise<string>((resolve, reject) => {
    output.on("close", () => {
      logger.debug("Artifacts packaged", { path })
      resolve(path)
    })

    archive.on("error", reject)

    archive.pipe(output)

    for (const artifact of artifacts) {
      archive.file(resolveFilePath(artifact), {
        name: basename(artifact),
      })
    }

    archive.finalize()
  })
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

/**
 * image/png => png
 * image/jpeg => jpeg
 * application/pdf => pdf
 */
export function contentType2Extension(contentType: string) {
  return contentType.split("/")[1]
}

export default {
  save,
  remove,
  packageArtifacts,
  contentType2Extension,
  geReadStream,
}
