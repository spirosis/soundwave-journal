import fs from "node:fs";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import {
  API_URL,
  FIXTURE_USER_EMAIL,
  FIXTURE_USER_PASSWORD,
  SESSION_STATE,
} from "./session";

// The one login of the whole run. Done through the API: the login form itself
// is covered by auth-session.spec.ts.
setup("log in the fixture user once", async ({ request }) => {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: FIXTURE_USER_EMAIL, password: FIXTURE_USER_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();

  fs.mkdirSync(path.dirname(SESSION_STATE), { recursive: true });
  await request.storageState({ path: SESSION_STATE });
});
