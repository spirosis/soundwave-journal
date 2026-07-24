import { chromium } from "playwright";

const results = {};

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const refreshCalls = [];
page.on("requestfinished", async (req) => {
  if (req.url().includes("/auth/refresh")) {
    const res = await req.response();
    refreshCalls.push({ status: res ? res.status() : null });
  }
});

const testEmail = `verify_logout_${Date.now()}@example.com`;

await page.goto("http://localhost:3000/register", { waitUntil: "networkidle" });
await page.locator('input[type="text"]').fill("Verify Logout");
await page.locator('input[type="email"]').fill(testEmail);
await page.locator('input[type="password"]').fill("TestPassword123!");
await page.locator('button[type="submit"]').click();
await page.waitForURL("http://localhost:3000/", { timeout: 10000 });
await page.waitForTimeout(500);

results.afterLogin = await page.locator("pre").first().textContent();

await page.getByRole("button", { name: /logout/i }).click();
await page.waitForTimeout(500);
results.immediatelyAfterLogout = await page.locator("pre").first().textContent();

refreshCalls.length = 0;
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);
results.afterReload = await page.locator("pre").first().textContent();
results.refreshCallsOnReload = [...refreshCalls];
results.testEmail = testEmail;

await browser.close();
console.log(JSON.stringify(results, null, 2));
