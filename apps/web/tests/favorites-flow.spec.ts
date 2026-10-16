import { expect, test } from "@playwright/test";

/**
 * A real, stable Deezer track used as a deterministic fixture. Search results
 * are mocked (see below) so this test never depends on Deezer's search ranking,
 * network availability, or rate limits. The id is real and long-lived (Queen's
 * "Bohemian Rhapsody" is not going anywhere) because favoriting it still calls
 * the backend's real metadata-resolution path, which itself calls Deezer's
 * track/album lookups server-side — only the /search *display* is faked here,
 * not the favorites/Library endpoints or the DB behind them.
 */
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
  const email = `e2e-fav-${Date.now()}@example.com`;

  // Only /api/search is mocked. Favorites and Library hit the real backend
  // against the test database for the rest of this test.
  await page.route("**/api/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [FIXTURE_TRACK], total: 1 }),
    });
  });

  await page.goto("/register");
  await page.getByLabel("Display name").fill("E2E Favorites");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123");
  await page.getByRole("button", { name: "Register" }).click();
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
