import pptr, { Browser, BrowserContext, type LaunchOptions } from "puppeteer";

export async function launch(options?: LaunchOptions) {
  let browser: Browser | null = null,
    context: BrowserContext | null = null;

  const close = async () => {
    const pages = await context?.pages();
    if (pages) {
      await Promise.all(pages.map((page) => page.close()));
    }
    await context?.close();
    await browser?.close();
  };

  try {
    browser = await pptr.launch({
      // executablePath: process.env["PUPPETEER_EXECUTABLE_PATH"],
      args: ["--disable-gpu"],
      ...options,
    });

    context = await browser.createBrowserContext();
  } catch (error) {
    console.error(error);
    await close();
    throw error;
  }

  return {
    browser,
    context,
    close,
  };
}
