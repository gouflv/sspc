import { promises as fs } from "fs";
import { launch } from "../lib/browser";

(async () => {
  const { context, close: closeAll } = await launch();

  const page = await context.newPage();

  // NOTE: pdf has it's own viewport
  // page.setViewport({ width: 440, height: 900 });

  const url = new URL("./html/typography.html", import.meta.url);

  await page.goto(url.href);

  try {
    await fs.mkdir("./out");
  } catch (e) {}

  await page.pdf({
    path: "./out/typography.pdf",
    width: 600,
    height: 800,
    printBackground: true,
  });

  await closeAll();
})();
