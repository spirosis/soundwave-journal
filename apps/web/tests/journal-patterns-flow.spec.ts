import { expect, test } from "@playwright/test";

const FIXTURE_USER_EMAIL = "e2e-fixture@example.com";
const FIXTURE_USER_PASSWORD = "FixtureUser123";

test("render journal patterns and streaks from deterministic data", async ({
  page,
}) => {
  await page.route("**/api/journal/insights**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        summary: { plays: 12, completes: 8, favorites: 3, skips: 1 },
        topGenres: [],
        topArtists: [],
      }),
    });
  });

  await page.route("**/api/journal/recent**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ events: [] }),
    });
  });

  await page.route("**/api/journal/time-patterns**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        byHour: [
          { hourOfDay: 9, plays: 2, completes: 1, skips: 0 },
          { hourOfDay: 21, plays: 8, completes: 4, skips: 1 },
        ],
        byDay: [
          { dayOfWeek: 2, plays: 3, completes: 1, skips: 0 },
          { dayOfWeek: 5, plays: 7, completes: 4, skips: 1 },
        ],
        topGenreHours: [{ genre: "rock", hourOfDay: 21, plays: 8 }],
      }),
    });
  });

  await page.route("**/api/journal/streaks**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        currentStreakDays: 4,
        longestStreakDays: 9,
        totalActiveDays: 18,
        lastActiveDate: "2026-10-21",
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(FIXTURE_USER_EMAIL);
  await page.getByLabel("Password").fill(FIXTURE_USER_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/journal");

  await expect(
    page.getByRole("heading", { name: "When you listen" })
  ).toBeVisible();

  // "21:00" also appears inside the "You most often play..." sentence below,
  // so this is scoped to the "Most active hour" metric card specifically.
  await expect(
    page
      .locator('[class*="patternMetric"]', { hasText: "Most active hour" })
      .getByText("21:00", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Friday", { exact: true })).toBeVisible();
  await expect(
    page.getByText("You most often play rock around 21:00.")
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Your consistency" })
  ).toBeVisible();
  await expect(page.getByText("4 days", { exact: true })).toBeVisible();
  await expect(page.getByText("9 days", { exact: true })).toBeVisible();
  await expect(page.getByText("18", { exact: true })).toBeVisible();
});
