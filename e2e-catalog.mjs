import { chromium } from "playwright";

const shotDir = "/private/tmp/claude-501/-Users-daongoclinh-Workspace-Test/8a79fbe6-251e-4934-89e5-7ed2e833ecc6/scratchpad";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

// Clear + seed fresh to test the Dexie v3 migration path cleanly
await page.goto("http://localhost:3000/teachers", { waitUntil: "networkidle" });
await page.click('button:has-text("Xoá dữ liệu")');
await page.waitForSelector("text=Đã xoá toàn bộ dữ liệu", { timeout: 10000 });
await page.waitForTimeout(500);

await page.click('button:has-text("Sinh dữ liệu mẫu")');
await page.waitForSelector("text=Đã sinh dữ liệu mẫu", { timeout: 15000 });
await page.waitForTimeout(500);
console.log("1. Seed after clear (migration path): OK, no console errors so far:", errors.length === 0);

// Settings page: view catalogs
await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
await page.waitForSelector("text=Cài đặt danh mục");
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/settings-page.png`, fullPage: true });
console.log("2. Settings page loaded: OK");

// Add a new specialty
await page.click('button:has-text("Thêm chuyên môn")');
await page.waitForSelector('[role="dialog"]:has-text("Thêm chuyên môn")');
await page.fill("#catalog-name", "AI/ML");
await page.click('[role="dialog"] button:has-text("Lưu")');
await page.waitForSelector('text=Đã thêm "AI/ML"', { timeout: 10000 });
console.log("3. Added new specialty 'AI/ML': OK");

// Verify it shows up in teacher form dropdown
await page.goto("http://localhost:3000/teachers", { waitUntil: "networkidle" });
await page.click('button:has-text("Thêm giảng viên")');
await page.waitForSelector('[role="dialog"]:has-text("Thêm giảng viên")');
await page.click('[role="dialog"] button:has-text("Chọn chuyên môn")');
await page.waitForSelector('[role="option"]');
const hasAIML = await page.locator('[role="option"]:has-text("AI/ML")').count();
console.log("4. New specialty appears in teacher form dropdown:", hasAIML > 0 ? "OK" : "FAIL");
await page.screenshot({ path: `${shotDir}/teacher-form-specialty-dropdown.png` });
await page.keyboard.press("Escape");

// Try deleting a specialty that's in use (should be blocked)
await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const firstSpecialtyDeleteBtn = page.locator('div:has-text("Chuyên môn giảng dạy") + div ul li').first().locator('button').nth(1);
await page.locator("text=Chuyên môn giảng dạy").locator("..").locator("..").locator("ul li").first().locator("button").nth(1).click();
await page.waitForSelector('text=Xoá "');
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/settings-delete-guard.png` });
const deleteDialogText = await page.locator('[role="alertdialog"]').textContent();
console.log("5. Delete guard message shown:", deleteDialogText?.includes("giảng viên") ? "OK" : "check manually");
await page.keyboard.press("Escape");

// Room equipment checkboxes
await page.goto("http://localhost:3000/rooms", { waitUntil: "networkidle" });
await page.click('button:has-text("Thêm phòng học")');
await page.waitForSelector('[role="dialog"]:has-text("Thêm phòng học")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/room-form-equipment.png` });
const equipmentCheckboxes = await page.locator('[role="dialog"] label:has(button[role="checkbox"])').count();
console.log("6. Equipment checkboxes in room form:", equipmentCheckboxes);

console.log("CONSOLE_ERRORS:", JSON.stringify(errors, null, 2));
await browser.close();
console.log("DONE");
