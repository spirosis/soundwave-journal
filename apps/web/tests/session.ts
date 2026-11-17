import fs from "node:fs";
import path from "node:path";
import { test as base, expect, type APIRequestContext } from "@playwright/test";

export { expect };

export const API_URL = "http://127.0.0.1:3101/api";
export const FIXTURE_USER_EMAIL = "e2e-fixture@example.com";
export const FIXTURE_USER_PASSWORD = "FixtureUser123";

/** Cookie jar of the fixture user's session, written by auth.setup.ts. */
export const SESSION_STATE = path.join(__dirname, "..", "playwright", ".auth", "session.json");

/**
 * `test` for specs that need to *be* logged in rather than test logging in.
 *
 * Every spec starts with the fixture user's refresh cookie already in the
 * browser, so the app restores the session on load (AuthBootstrap) and no
 * spec spends a login attempt: `authWrite` allows 10 per 15 minutes per IP.
 *
 * The API rotates the refresh token on every use and rejects the previous
 * one, so a fixed saved state would be dead after the first page load. Each
 * test therefore hands its rotated cookie to the next one. That chain relies
 * on the suite running serially (workers: 1 in playwright.config.ts).
 */
export const test = base.extend({
  storageState: SESSION_STATE,

  // Named `provide` because eslint's rules-of-hooks mistakes a callback called
  // `use` for React's `use` hook.
  context: async ({ context }, provide) => {
    await provide(context);

    // Cookies only: localStorage (recent searches) must not leak between specs.
    const { cookies } = await context.storageState();
    fs.writeFileSync(SESSION_STATE, JSON.stringify({ cookies, origins: [] }));
  },
});

/** Access token for seeding through the API, taken from the current session. */
export async function getAccessToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_URL}/auth/refresh`);
  expect(response.ok()).toBeTruthy();
  const { accessToken } = (await response.json()) as { accessToken: string };
  return accessToken;
}
