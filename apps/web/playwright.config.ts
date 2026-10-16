import { defineConfig, devices } from "@playwright/test";

const webUrl = "http://127.0.0.1:3100";
const apiUrl = "http://127.0.0.1:3101";

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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
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
