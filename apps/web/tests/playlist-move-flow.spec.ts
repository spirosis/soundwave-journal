import { expect, test } from "@playwright/test";

/**
 * Seeds 13 tracks directly against the real backend (bypassing the UI and
 * Deezer entirely — POST /playlists/:id/tracks only stores client-supplied
 * metadata, it never resolves anything) so the playlist spans two pages
 * (TRACKS_PAGE_SIZE = 12 in playlist-detail-view.tsx). That's what lets this
 * test prove the real risk: moving the last track of page 1 up/down across
 * the pagination boundary into page 2, and vice versa.
 */
const API_URL = "http://127.0.0.1:3101/api";
const FIXTURE_USER_EMAIL = "e2e-fixture@example.com";
const FIXTURE_USER_PASSWORD = "FixtureUser123";
const PLAYLIST_NAME = "E2E Move Playlist";
const TRACK_COUNT = 13;

function buildTrackPayload(index: number) {
  return {
    deezerTrackId: 9_000_000_000 + index,
    trackTitle: `Move Test Track ${index}`,
    artistName: "E2E Move Artist",
    durationSec: 180,
  };
}

test("move a track across the pagination boundary between page 1 and page 2", async ({
  page,
}) => {
  const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: FIXTURE_USER_EMAIL, password: FIXTURE_USER_PASSWORD },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const { accessToken } = (await loginResponse.json()) as {
    accessToken: string;
  };
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const createPlaylistResponse = await page.request.post(
    `${API_URL}/playlists`,
    { headers: authHeaders, data: { name: PLAYLIST_NAME } }
  );
  expect(createPlaylistResponse.ok()).toBeTruthy();
  const playlist = (await createPlaylistResponse.json()) as { id: string };

  for (let index = 1; index <= TRACK_COUNT; index += 1) {
    const response = await page.request.post(
      `${API_URL}/playlists/${playlist.id}/tracks`,
      { headers: authHeaders, data: buildTrackPayload(index) }
    );
    expect(response.ok()).toBeTruthy();
  }

  // The API login above already set the refresh-token cookie on this
  // browser context, so loading the app bootstraps the session from that
  // cookie (see AuthBootstrap) instead of going through the login form
  // again — auth-session.spec.ts already covers the UI login path.
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  await page.goto("/library");
  await page.locator("aside").getByRole("button", { name: PLAYLIST_NAME }).click();

  await expect(
    page.getByText("1. Move Test Track 1", { exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "Next page of tracks" }).click();

  const track13Title = "Move Test Track 13";
  await expect(
    page.getByText(`13. ${track13Title}`, { exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: `Move ${track13Title} up` }).click();

  // The move swapped track 13 (page 2) with track 12 (page 1). Invalidating
  // ["playlist-tracks", playlistId] refetches both pages, so track 13 should
  // disappear from page 2 once the swap lands server-side.
  await expect(
    page.getByText(`13. ${track13Title}`, { exact: true })
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Previous page of tracks" }).click();

  await expect(
    page.getByText(`12. ${track13Title}`, { exact: true })
  ).toBeVisible();
});
