import archiver from "archiver"
import { createWriteStream, unlink } from "node:fs"
import { mkdir } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import { Stream } from "node:stream"

function resolveFilePath(filename: string) {
  const base =
    process.env["ARTIFACT_BASE"] || new URL("../data", import.meta.url).pathname
  return join(base, filename)
}

async function save(stream: Stream, filename: string) {
  const path = resolveFilePath(filename)
  await mkdir(dirname(path), { recursive: true })
  return new Promise<string>((resolve, reject) => {
    const writer = createWriteStream(path)
    stream.pipe(writer)
    writer.on("finish", () => resolve(path))
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
    output.on("close", () => resolve(path))
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
}
