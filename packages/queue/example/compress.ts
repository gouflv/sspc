import { compress } from "compress-pdf"
import { createWriteStream } from "node:fs"
import { Readable } from "node:stream"
;(async () => {
  const compressed = await compress(
    "/Users/gouflv/Downloads/capture-1752927717271.pdf",
    {
      imageQuality: 150,
    },
  )

  // save to file
  const stream = Readable.from(compressed)
  const filename = "compressed.pdf"
  stream.pipe(createWriteStream(filename))
  stream.on("finish", () => {
    console.log(`File saved as ${filename}`)
  })
})()
