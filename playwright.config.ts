import { defineConfig } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100"

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/e2e/support/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer:
    process.env.E2E_START_LOCAL_APP === "true"
      ? {
          command: "node scripts/e2e/start-app.mjs",
          url: new URL("/login", baseURL).toString(),
          reuseExistingServer: false,
          timeout: 120_000,
        }
      : undefined,
})
