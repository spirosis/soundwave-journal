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
