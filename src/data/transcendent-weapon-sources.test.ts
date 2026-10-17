import { describe, expect, it } from "vitest";
import {
  karelsMothershipLoot,
  transcendentDrops,
  transcendentFirstClears,
  transcendentShop,
  transcendentSourceWeapons,
  trialsLoot,
} from "./transcendent-weapon-sources";

// Copied from the Update 1.4.0 notes (ADR 0032); these guard the copy, not the game.
describe("Transcendent weapon sources", () => {
  it("covers the 11 weapons Update 1.4.0 added, and Monster Hunter (1.4.5)", () => {
    expect(transcendentSourceWeapons.size).toBe(12);
    expect(transcendentSourceWeapons.has("Storm Cage")).toBe(true);
    expect(transcendentSourceWeapons.has("Monster Hunter")).toBe(true);
  });

  it("lists every content from the notes' table once, with sane ranges", () => {
    // Update 1.4.0's 71, Breach Tracking and Cradle of Evolution (1.4.3), Onslaught
    // Stage 5 (1.4.5).
    expect(transcendentDrops).toHaveLength(74);
    expect(new Set(transcendentDrops.map((drop) => drop.content)).size).toBe(
      74,
    );
    const ranges = [
      ...transcendentDrops.map((drop) => drop.quality),
      ...karelsMothershipLoot.map((loot) => loot.quality),
      ...trialsLoot.rounds,
      ...trialsLoot.rotational,
    ];
    for (const range of ranges) {
      expect(range.min).toBeGreaterThanOrEqual(1);
      expect(range.max).toBeLessThanOrEqual(400);
      expect(range.min).toBeLessThan(range.max);
    }
    for (const drop of transcendentDrops) {
      expect(drop.chance).toMatch(/^\d+(\.\d+)?%$/);
    }
  });

  it("keeps Onslaught's revised lows, not the struck-out ones", () => {
    const onslaught = transcendentDrops
      .filter((drop) => drop.content.startsWith("Onslaught"))
      .map((drop) => drop.quality.min);
    expect(onslaught).toEqual([261, 271, 281, 291, 301]);
  });

  it("has Karel's Mothership's 1.4.5 chances", () => {
    expect(karelsMothershipLoot.map((loot) => loot.chance)).toEqual([
      "15.2%",
      "16.9%",
    ]);
  });

  it("has the first clears, Trials' four rounds and Deslin's two boxes", () => {
    expect(transcendentFirstClears.map((clear) => clear.quality)).toEqual([
      25, 50, 75, 100,
    ]);
    expect(trialsLoot.rounds).toHaveLength(4);
    expect(trialsLoot.rotational).toHaveLength(4);
    expect(transcendentShop.map((entry) => entry.price)).toEqual([400, 800]);
  });
});
