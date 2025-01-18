import { promises as fs } from "fs";
import { launch } from "../lib/browser";

(async () => {
  const { context, closeAll } = await launch();

  const page = await context.newPage();

  await page.setViewport({ width: 800, height: 1500 });

  // get absolute path of the `./html/typography.html` file relative to the current file
  const url = new URL("./html/typography.html", import.meta.url);

  await page.goto(url.href);

  try {
    await fs.mkdir("./out");
  } catch (e) {}
  await page.screenshot({ path: "./out/typography.png" });

  await closeAll();
})();
