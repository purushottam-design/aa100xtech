import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: ".migration/browser-results",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: ".migration/playwright-report", open: "never" }]],
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] ?? "http://127.0.0.1:3100",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
