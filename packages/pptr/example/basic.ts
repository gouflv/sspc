import { promises as fs } from "fs";
import { launch } from "../lib/browser";

(async () => {
  const { context, close: closeAll } = await launch();

  const page = await context.newPage();

  await page.goto(
    "https://cxbook.chaoxing.com/moral-shop/bt-sjl-custom/?type=charts&fid=189505&uid=359799421"
  );

  await page.waitForNavigation({ waitUntil: "networkidle0" });

  try {
    await fs.mkdir("./out");
  } catch (e) {}
  await page.screenshot({ path: "./out/basic.png" });

  await closeAll();
})();
