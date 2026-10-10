import { expect, test } from "@playwright/test";

test("register, restore session after reload, and logout", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/register");

  await page.getByLabel("Display name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: "Logout" })
  ).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: "Logout" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();

  // AuthGuard redirects to /login?next=<pathname> (preserving where the user
  // was), so this intentionally matches by prefix rather than an exact URL.
  await expect(page).toHaveURL(/\/login/);
});
