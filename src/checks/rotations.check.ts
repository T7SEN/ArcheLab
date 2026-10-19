import { describe, expect, it } from "vitest";
import {
  pairIn,
  rotationAt as axionRotationAt,
} from "@/features/axion/rotation";
import { dayAt as day400At, pairOn } from "@/features/infiltration-400/day-400";
import {
  dayAt as purgeDayAt,
  mapOn,
} from "@/features/void-erosion-purge/purge-day";
import {
  axionCurrentPair,
  infiltrationToday,
  purgeCurrentMap,
  samePair,
  tfdhubPages,
} from "./tfdhub";

// The daily check (ADR 0055): the rotation pages built on tfdhub.gg's cycles against
// tfdhub's own pages, read with tfdhub's permission (T7SEN, 2026-10-19). A page tfdhub
// served from its cache just before a change still shows the rotation before ours, so
// that one counts too.

/** How many times a page is asked for, and the pause between, before the check fails. */
const attempts = 3;
const retryDelayMs = 5_000;

/**
 * A page's HTML. A dropped connection is tried again, so one slow answer doesn't open an
 * issue (2026-10-19: a first run timed out connecting, the next answered).
 */
async function page(url: string): Promise<string> {
  let failure: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "ArcheLab daily check (with tfdhub.gg's permission)",
        },
        signal: AbortSignal.timeout(60_000),
      });
      if (response.ok) {
        return await response.text();
      }
      failure = new Error(`${url} answered ${String(response.status)}.`);
    } catch (error) {
      failure = error;
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  throw failure;
}

const changed = (what: string) =>
  `tfdhub.gg's ${what} page has changed its layout, so the check can't read it. Update src/checks/tfdhub.ts.`;

describe("the rotation pages agree with tfdhub.gg", () => {
  const now = Date.now();

  it("400% Infiltration Operations", async () => {
    const today = infiltrationToday(await page(tfdhubPages.infiltration400));
    if (today === null) {
      throw new Error(changed("400% Infiltration Operations"));
    }
    const ours = pairOn(day400At(Date.parse(today.startsAt)));
    expect(
      samePair(ours, today.operations),
      `On the day from ${today.startsAt}, tfdhub shows ${today.operations.join(" and ")}; ArcheLab shows ${ours?.join(" and ") ?? "nothing"} (src/data/infiltration-400.ts).`,
    ).toBe(true);
  });

  it("Axion Operational Areas", async () => {
    const shown = axionCurrentPair(await page(tfdhubPages.axion));
    if (shown === null) {
      throw new Error(changed("Axion Operational Area"));
    }
    const rotation = axionRotationAt(now);
    const ours = pairIn(rotation);
    expect(
      samePair(ours, shown) || samePair(pairIn(rotation - 1), shown),
      `tfdhub shows ${shown.join(" and ")} now; ArcheLab shows ${ours?.join(" and ") ?? "nothing"} (src/data/axion-operational-areas.ts).`,
    ).toBe(true);
  });

  it("Void Erosion Purge", async () => {
    const shown = purgeCurrentMap(await page(tfdhubPages.purge));
    if (shown === null) {
      throw new Error(changed("Void Erosion Purge"));
    }
    const day = purgeDayAt(now);
    expect(
      shown === mapOn(day) || shown === mapOn(day - 1),
      `tfdhub shows ${shown} today; ArcheLab shows ${mapOn(day) ?? "nothing"} (src/data/void-erosion-purge.ts).`,
    ).toBe(true);
  });
});
