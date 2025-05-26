import { compress } from "compress-pdf"
import { CaptureResult } from "./capture"

export async function compressPDF(data: CaptureResult): Promise<CaptureResult> {
  const buffer = await compress(Buffer.from(data.raw), {
    resolution: "ebook",
  })
  return {
    contentType: data.contentType,
    raw: buffer,
  }
}
