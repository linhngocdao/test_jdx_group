import { chromium } from "playwright";

const shotDir = "/private/tmp/claude-501/-Users-daongoclinh-Workspace-Test/8a79fbe6-251e-4934-89e5-7ed2e833ecc6/scratchpad";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await page.waitForSelector("text=Tổng quan vận hành");
await page.waitForTimeout(500);

// Find a circle element (data point marker) and hover its exact center
const circle = page.locator("circle").nth(3);
const box = await circle.boundingBox();
console.log("Circle box:", box);
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${shotDir}/dash-tooltip-precise.png` });
}

await browser.close();
console.log("DONE");
