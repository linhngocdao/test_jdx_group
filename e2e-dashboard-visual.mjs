import { chromium } from "playwright";

const shotDir = "/private/tmp/claude-501/-Users-daongoclinh-Workspace-Test/8a79fbe6-251e-4934-89e5-7ed2e833ecc6/scratchpad";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

await page.goto("http://localhost:3000/teachers", { waitUntil: "networkidle" });
await page.click('button:has-text("Sinh dữ liệu mẫu")');
await page.waitForSelector("text=Đã sinh dữ liệu mẫu", { timeout: 15000 });
await page.waitForTimeout(500);

await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await page.waitForSelector("text=Tổng quan vận hành");
await page.waitForTimeout(500);
await page.screenshot({ path: `${shotDir}/dash-light-full.png`, fullPage: true });

// Hover the growth chart to check tooltip — target a data point precisely
const chartArea = page.locator("svg").first();
const box = await chartArea.boundingBox();
if (box) {
  // point index 4 of 7, roughly at x-fraction (4/6)=0.667 within the plot area
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.45);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shotDir}/dash-light-tooltip.png` });
}

// Table view toggle
await page.click('button:has-text("Xem bảng")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/dash-light-table.png` });
await page.click('button:has-text("Xem biểu đồ")');

// Dark mode
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/dash-dark-full.png`, fullPage: true });

// Mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => document.documentElement.classList.remove("dark"));
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/dash-mobile.png`, fullPage: true });

console.log("CONSOLE_ERRORS:", JSON.stringify(errors, null, 2));
await browser.close();
console.log("DONE");
