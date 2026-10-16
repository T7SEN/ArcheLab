import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = `http://localhost:${String(port)}`;
const isCI = process.env.CI === "true";

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Share links must round-trip across browsers (Phase 3 acceptance, ADR 0015), and
    // the command palette must open, pick and give focus back in each (ADR 0022).
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /(share|palette)\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /(share|palette)\.spec\.ts/,
    },
  ],
  // Serves the production build, so run `pnpm build` first.
  webServer: {
    command: "pnpm start",
    url: baseURL,
    reuseExistingServer: !isCI,
  },
});
