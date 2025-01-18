import pptr, { type LaunchOptions } from "puppeteer-core";

export async function launch(options?: LaunchOptions) {
  const browser = await pptr.launch({
    executablePath: process.env["PUPPETEER_EXECUTABLE_PATH"],
    args: ["--disable-gpu"],
    ...options,
  });
  const context = await browser.createBrowserContext();

  return {
    browser,
    context,
    async closeAll() {
      const pages = await context.pages();
      await Promise.all(pages.map((page) => page.close()));
      await context.close();
      await browser.close();
    },
  };
}
