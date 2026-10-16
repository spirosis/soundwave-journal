import { expect, test } from "@playwright/test";

/**
 * Logs in as a pre-seeded fixture user (see apps/api/src/scripts/seed-e2e-fixtures.ts,
 * run before Playwright in CI and expected to have been run locally too) that
 * already has track_metadata for this track. That means POST /favorites below
 * finds existing metadata and never calls Deezer — only the /search *display*
 * is mocked via page.route(); the real metadata-resolution call is simply never
 * triggered at all for this fixture, rather than relying on Deezer answering.
 *
 * These values must match the seed script exactly.
 */
const FIXTURE_USER_EMAIL = "e2e-fixture@example.com";
const FIXTURE_USER_PASSWORD = "FixtureUser123";

const FIXTURE_TRACK = {
  id: 4091937401,
  title: "Bohemian Rhapsody",
  artistName: "Queen",
  albumTitle: "A Night At The Opera",
  previewUrl:
    "https://cdnt-preview.dzcdn.net/api/1/1/5/f/9/0/5f9a6a2ea1876e6d07c4b7feefa99951.mp3",
  durationSec: 354,
  coverUrl:
    "https://cdn-images.dzcdn.net/images/cover/0b56f4eee05fa1ea753c5654b2cdb70c/500x500-000000-80-0-0.jpg",
  deezerUrl: "https://www.deezer.com/track/4091937401",
};

test("search (mocked), favorite a fixture track, and see it in Library", async ({
  page,
}) => {
  // Only /api/search is mocked. Favorites and Library hit the real backend
  // against the test database for the rest of this test.
  await page.route("**/api/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [FIXTURE_TRACK], total: 1 }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(FIXTURE_USER_EMAIL);
  await page.getByLabel("Password").fill(FIXTURE_USER_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/search");
  await page.locator("#search-query").fill("bohemian rhapsody");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.getByText(FIXTURE_TRACK.title)).toBeVisible();
  await expect(page.getByText(FIXTURE_TRACK.artistName)).toBeVisible();

  const favoriteButton = page.getByRole("button", { name: "Favorite" });
  await favoriteButton.click();
  await expect(
    page.getByRole("button", { name: "Remove favorite" })
  ).toBeVisible();

  // Reload resets the Search view to its recent-searches state. Re-running the
  // same (still-mocked) search confirms the favorite persisted server-side —
  // not just in this page's in-memory state.
  await page.reload();
  await page.getByRole("button", { name: "bohemian rhapsody" }).click();

  await expect(
    page.getByRole("button", { name: "Remove favorite" })
  ).toBeVisible();

  await page.goto("/library");
  await expect(page.getByText(FIXTURE_TRACK.title)).toBeVisible();
  await expect(page.getByText(FIXTURE_TRACK.artistName)).toBeVisible();
});
