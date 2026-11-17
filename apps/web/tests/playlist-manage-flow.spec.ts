import { expect, test } from "./session";

const PLAYLIST_NAME = "E2E Manage Playlist";
const RENAMED_PLAYLIST_NAME = "E2E Renamed Playlist";

test("rename a playlist, then delete it", async ({ page }) => {
  await page.goto("/library");
  await page.getByLabel("Playlist name").fill(PLAYLIST_NAME);
  await page.getByRole("button", { name: "Create playlist" }).click();

  // Scoped to <aside>: the sidebar button's accessible name includes its
  // "Created <date>" line, and the detail view's own Rename/Delete buttons
  // also contain this substring in their aria-labels.
  await expect(
    page.locator("aside").getByRole("button", { name: PLAYLIST_NAME })
  ).toBeVisible();

  await page
    .getByRole("button", { name: `Rename playlist ${PLAYLIST_NAME}` })
    .click();

  await page.getByLabel("Rename playlist").fill(RENAMED_PLAYLIST_NAME);
  await page.getByRole("button", { name: "Save" }).click();

  // The sidebar list is refetched via query invalidation after rename.
  await expect(
    page
      .locator("aside")
      .getByRole("button", { name: RENAMED_PLAYLIST_NAME })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: RENAMED_PLAYLIST_NAME })
  ).toBeVisible();

  await page
    .getByRole("button", { name: `Delete playlist ${RENAMED_PLAYLIST_NAME}` })
    .click();
  await page
    .getByRole("button", {
      name: `Confirm delete playlist ${RENAMED_PLAYLIST_NAME}`,
    })
    .click();

  await expect(
    page
      .locator("aside")
      .getByRole("button", { name: RENAMED_PLAYLIST_NAME })
  ).toHaveCount(0);

  await expect(
    page.getByRole("heading", { name: RENAMED_PLAYLIST_NAME })
  ).toHaveCount(0);

  await expect(
    page.getByRole("heading", { name: "Your playlists" })
  ).toBeVisible();
});
