import { expect, test } from "@playwright/test";

const FIXTURE_USER_EMAIL = "e2e-fixture@example.com";
const FIXTURE_USER_PASSWORD = "FixtureUser123";
const PLAYLIST_NAME = "E2E Queen Playlist";

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

test("create a playlist, add a search track, and remove it from Library", async ({
  page,
}) => {
  await page.route("**/api/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [FIXTURE_TRACK],
        total: 1,
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(FIXTURE_USER_EMAIL);
  await page.getByLabel("Password").fill(FIXTURE_USER_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/library");
  await page.getByLabel("Playlist name").fill(PLAYLIST_NAME);
  await page.getByRole("button", { name: "Create playlist" }).click();

  // The sidebar playlist button's accessible name also includes its
  // "Created <date>" line, so this intentionally isn't an exact match —
  // unlike the "Add to playlist" menu entry below, which has no extra text.
  await expect(
    page.getByRole("button", { name: PLAYLIST_NAME })
  ).toBeVisible();

  await page.goto("/search");
  await page.locator("#search-query").fill("bohemian rhapsody");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.getByText(FIXTURE_TRACK.title)).toBeVisible();

  await page
    .getByRole("button", {
      name: `Track actions for ${FIXTURE_TRACK.title}`,
    })
    .click();

  await expect(page.getByText("Add to playlist")).toBeVisible();

  await page
    .getByRole("button", { name: PLAYLIST_NAME, exact: true })
    .click();

  // The menu closes only after POST /playlists/:id/tracks succeeds.
  await expect(page.getByText("Add to playlist")).toBeHidden();

  await page.goto("/library");

  await page.getByRole("button", { name: PLAYLIST_NAME }).click();

  await expect(
    page.getByText(`1. ${FIXTURE_TRACK.title}`, { exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "Remove track" }).click();

  await expect(
    page.getByText(`1. ${FIXTURE_TRACK.title}`, { exact: true })
  ).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: "Remove track" })
  ).toHaveCount(0);
});
