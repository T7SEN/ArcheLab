import { describe, expect, it } from "vitest";
import type { AcquisitionRecord } from "./shared-sets";
import { timerPlaces } from "./timer-places";

// Shaped like NEXON's acquisition-detail.json (read 2026-10-19).
const place = (id: string, name: string): AcquisitionRecord => ({
  acquisition_detail_id: id,
  acquisition_detail_name: name,
});

describe("timerPlaces", () => {
  it("links each bounty target's places to its day, and Wall Crasher's to its timer", () => {
    expect([
      ...timerPlaces([
        place(
          "DC:BountyHunt:620800105",
          "[Bounty Operations] - [Hungry Abyss Scarab] - [Sync Loot Reward]",
        ),
        place(
          "MS:BountyHunt:620400103",
          "[ Bounty Operations ] - [ Soul Reaper Gruncah ] complete",
        ),
        place(
          "VB:540000901:Hard",
          "[Axion Plains] Intercept Battle: [Wall Crasher] [Hard]",
        ),
        // Neither: another Intercept Battle, and a target the page doesn't know.
        place("VB:540000101:Hard", "Intercept Battle: [Grave Walker] [Hard]"),
        place("DC:BountyHunt:9", "[Bounty Operations] - [Someone New]"),
      ]),
    ]).toEqual([
      ["DC:BountyHunt:620800105", "/timers?bounty=hungry-abyss-scarab"],
      ["MS:BountyHunt:620400103", "/timers?bounty=soul-reaper-gruncah"],
      ["VB:540000901:Hard", "/timers#wall-crasher"],
    ]);
  });
});
