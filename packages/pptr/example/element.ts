import { promises as fs } from "fs";
import { launch } from "../lib/browser";

(async () => {
  const { context, closeAll } = await launch();

  const page = await context.newPage();

  page.setViewport({ width: 800, height: 600 });

  const url = new URL("./html/typography.html", import.meta.url);

  await page.goto(url.href);

  try {
    await fs.mkdir("./out");
  } catch (e) {}

  const el = await page.waitForSelector(".container");

  if (!el) {
    console.error("Element not found");
    return;
  }

  await el.screenshot({ path: "./out/element.png" });

  await closeAll();
})();
