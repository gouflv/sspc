import { promises as fs } from "fs"
import { launch } from "../lib/browser"
;(async () => {
  const { context, close: closeAll } = await launch()

  const page = await context.newPage()

  //
  // NOTE: 支持封面，静态内容的页眉、页脚，不支持页码
  //
  const url = new URL("./html/pdf-layout.html", import.meta.url)

  await page.goto(url.href)

  try {
    await fs.mkdir("./out")
  } catch (e) {}

  await page.pdf({
    path: "./out/pdf-layout.pdf",
    printBackground: true,
    format: "A4",
  })

  await closeAll()
})()
