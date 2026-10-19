import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { hqOrderCycles } from "@/data/timers";
import { weekStart } from "@/features/difficulty-rewards/reward-week";
import { fetchDatabaseItems } from "@/lib/nexon/database-items";
import { fetchDifficultyRewards } from "@/lib/nexon/difficulty-rewards";
import { metadataSets, metadataUrl } from "@/lib/nexon/metadata";

// The daily check (ADR 0055): NEXON's sets as the build reads them, the warnings the
// build would log, and the schedules kept by hand before they run out.

const dayMs = 24 * 60 * 60 * 1000;

/** Where the check leaves the sets' versions for `scripts/daily-check/run.mjs`. */
const outDir = process.env.DAILY_CHECK_DIR ?? ".daily-check";

describe("NEXON's data", () => {
  it("answers for every set the site uses", async () => {
    // A HEAD request each: the version (ETag, Last-Modified, size) without the body.
    const answers = await Promise.all(
      metadataSets.map(async (set) => {
        const response = await fetch(metadataUrl(set), {
          method: "HEAD",
          signal: AbortSignal.timeout(30_000),
        });
        const header = (name: string) => response.headers.get(name) ?? "";
        return {
          set,
          status: response.status,
          version: [
            header("etag"),
            header("last-modified"),
            header("content-length"),
          ].join(" "),
        };
      }),
    );
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "nexon-sets.json"),
      `${JSON.stringify(
        Object.fromEntries(answers.map(({ set, version }) => [set, version])),
        null,
        2,
      )}\n`,
    );
    expect(
      answers
        .filter((answer) => answer.status !== 200)
        .map(
          (answer) => `${answer.set}.json answered ${String(answer.status)}`,
        ),
    ).toEqual([]);
  });

  it("loads for every page without a warning", async () => {
    // The checks every page's data makes while it builds: names that don't match,
    // entries that fail validation, sets that don't load.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      await fetchDatabaseItems();
    } catch (error) {
      warn.mockRestore();
      throw error;
    }
    const warnings = warn.mock.calls.map((call) => call.map(String).join(" "));
    warn.mockRestore();
    expect(warnings).toEqual([]);
  });
});

describe("the schedules kept by hand", () => {
  it("list HQ Special Orders for the week ahead", () => {
    const last = hqOrderCycles.at(-1);
    expect(
      last !== undefined && Date.parse(last.endsAt) > Date.now() + 7 * dayMs,
      `HQ Special Orders are listed only to ${last?.endsAt ?? "no date"}. Add the next update's schedule to src/data/timers.ts.`,
    ).toBe(true);
  });

  it("list Difficulty Level Rewards for two weeks ahead", async () => {
    const { rotations } = await fetchDifficultyRewards();
    const last = rotations.at(-1);
    const ends = last === undefined ? 0 : weekStart(last + 1);
    expect(
      ends > Date.now() + 14 * dayMs,
      `NEXON's reward list runs out on ${new Date(ends).toISOString()}; the Difficulty Level Rewards page shows nothing after it.`,
    ).toBe(true);
  });
});
