import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const webUrl = "http://127.0.0.1:3100";
const apiUrl = "http://127.0.0.1:3101";

// Local convenience: the E2E variables (test DATABASE_URL, JWT secrets) may
// live in apps/web/.env.e2e (gitignored) so `npm run test:e2e` and the VS Code
// Playwright extension work without exporting them. Only variables that are
// not already set are filled in, so CI's explicit environment always wins.
const localEnvPath = resolve(__dirname, ".env.e2e");
if (existsSync(localEnvPath)) {
  for (const line of readFileSync(localEnvPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^(["'])(.*)\1$/, "$2");
    }
  }
}

for (const variable of [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
]) {
  if (!process.env[variable]) {
    throw new Error(`Missing ${variable} for E2E tests`);
  }
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  // fullyParallel: false only stops tests within a single file from racing
  // each other. With multiple spec files, Playwright still spreads them
  // across workers by default — and favorites-flow/playlist-flow share the
  // same fixture user and rows in the test DB, so running them concurrently
  // causes real cross-test contamination. Force one worker until specs stop
  // sharing mutable state.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: webUrl,
    trace: "on-first-retry",
  },
  // Chromium by default (CI). Set E2E_BROWSERS=chromium,webkit,firefox to run
  // the suite in other engines locally; reseed between projects because the
  // specs share one fixture user and are only idempotent per run.
  projects: (process.env.E2E_BROWSERS ?? "chromium")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      use: {
        ...devices[
          name === "webkit"
            ? "Desktop Safari"
            : name === "firefox"
              ? "Desktop Firefox"
              : "Desktop Chrome"
        ],
      },
    })),
  webServer: [
    {
      command: "npm run dev",
      cwd: "../api",
      url: `${apiUrl}/api/health`,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: "3101",
        FRONTEND_URL: webUrl,
      },
    },
    {
      command: "npm run dev -- --port 3100",
      cwd: ".",
      url: webUrl,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: `${apiUrl}/api`,
      },
    },
  ],
});
