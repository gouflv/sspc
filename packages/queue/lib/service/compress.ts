import { compress } from "compress-pdf"
import Stream, { Readable } from "stream"

export async function compressPDF(source: string): Promise<{
  stream: Stream.Readable
  duration: number
}> {
  const startTime = Date.now()

  const compressed = await compress(source, {
    imageQuality: 150,
  })

  const duration = Date.now() - startTime

  return {
    stream: Readable.from(compressed),
    duration,
  }
}
