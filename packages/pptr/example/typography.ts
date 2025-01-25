import { promises as fs } from "fs"
import { launch } from "../lib/browser"

;(async () => {
  const { context, close: closeAll } = await launch()

  const page = await context.newPage()

  page.setViewport({ width: 1440, height: 900 })

  const url = new URL("./html/typography.html", import.meta.url)

  await page.goto(url.href)

  try {
    await fs.mkdir("./out")
  } catch (e) {}
  await page.screenshot({ path: "./out/typography.png", fullPage: true })

  await closeAll()
})()
