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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Serves the production build, so run `pnpm build` first.
  webServer: {
    command: "pnpm start",
    url: baseURL,
    reuseExistingServer: !isCI,
  },
});
