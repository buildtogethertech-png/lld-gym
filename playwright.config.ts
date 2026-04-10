import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001";
const startServer = process.env.E2E_SKIP_WEBSERVER !== "1";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Two journeys hit the same dev server; single worker avoids rare session races on localhost.
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 120_000,
  expect: { timeout: 25_000 },
  use: {
    baseURL,
    // Local: show Chromium so you can watch register → problem → evaluate. CI env → headless.
    headless: Boolean(process.env.CI) || process.env.E2E_HEADLESS === "1",
    // Taller window so the fixed bottom “Evaluate with AI” bar is on-screen.
    viewport: { width: 1440, height: 900 },
    // Optional: E2E_SLOW_MO=250 slows every Playwright action (typing gets long). Prefer E2E_STEP_PAUSE_MS.
    launchOptions: {
      slowMo: (() => {
        if (process.env.CI) return 0;
        const v = process.env.E2E_SLOW_MO;
        if (!v) return 0;
        const n = Number.parseInt(v, 10);
        return Number.isFinite(n) && n >= 0 ? n : 0;
      })(),
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: startServer
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
