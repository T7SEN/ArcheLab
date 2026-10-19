import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The daily check's live checks (ADR 0055): `src/checks/*.check.ts` fetch NEXON's sets
 * and tfdhub.gg's pages, so they stay out of `pnpm test`. The JSON report is what
 * `scripts/daily-check/run.mjs` turns into issues. The aliases are vitest.config.mts's.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    include: ["src/checks/**/*.check.ts"],
    environment: "node",
    testTimeout: 180_000,
    reporters: [
      "default",
      [
        "json",
        {
          outputFile: `${process.env.DAILY_CHECK_DIR ?? ".daily-check"}/report.json`,
        },
      ],
    ],
  },
});
