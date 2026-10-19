import { expect, test } from "@playwright/test";

/**
 * Logs in as the pre-seeded fixture user (see
 * apps/api/src/scripts/seed-e2e-fixtures.ts). Both /api/discovery/genres and
 * /api/search are mocked so this test never depends on Deezer answering —
 * it only exercises the real navigation from a genre tile to a search result.
 */
const FIXTURE_USER_EMAIL = "e2e-fixture@example.com";
const FIXTURE_USER_PASSWORD = "FixtureUser123";

const MOCK_GENRE = { id: 152, name: "Rock", pictureUrl: null };

const MOCK_TRACK = {
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

test("browse genres in Discovery and navigate to real Search results", async ({
  page,
}) => {
  await page.route("**/api/discovery/genres**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [MOCK_GENRE] }),
    });
  });

  await page.route("**/api/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [MOCK_TRACK], total: 1 }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(FIXTURE_USER_EMAIL);
  await page.getByLabel("Password").fill(FIXTURE_USER_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/discovery");
  await expect(page.getByText(MOCK_GENRE.name)).toBeVisible();

  await page.getByRole("link", { name: MOCK_GENRE.name }).click();

  await expect(page).toHaveURL(`/search?q=${MOCK_GENRE.name}`);
  await expect(page.getByText(MOCK_TRACK.title)).toBeVisible();
  await expect(page.getByText(MOCK_TRACK.artistName)).toBeVisible();
});
