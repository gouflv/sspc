import { launch } from "./browser"
import { capturePage, initPage } from "./page"
import type { CaptureParamsType } from "./types"

export default async function capture(params: CaptureParamsType) {
  const { context, close } = await launch()

  try {
    const page = initPage(await context.newPage(), params)

    await page.goto(params.url)

    await page.waitForNavigation({ waitUntil: "networkidle0" })

    return capturePage(page, params)
  } catch (error) {
    console.error(error)
    throw error
  } finally {
    await close()
  }
}
