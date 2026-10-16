import { describe, expect, it } from "vitest";
import { rarityOf } from "@/features/game-data/rarity";
import { tierOptions, versionTier } from "./module-tiers";

describe("tierOptions", () => {
  it("lists Ancestors and Trigger first, then the rarities, highest first", () => {
    // T7SEN, 2026-10-16. NEXON's tier ids for Ancestors and Trigger don't decide it.
    const tiers = tierOptions([
      { tier: "Tier1", type: null },
      { tier: "Tier3", type: "Trigger" },
      { tier: "Tier4", type: null },
      { tier: "Tier2", type: "Multi-Hit Chance" },
      { tier: "Tier4", type: "Ancestors" },
      { tier: "Tier3", type: null },
      { tier: "Tier1", type: null },
    ]);
    expect(tiers.map((tier) => tier.name)).toEqual([
      "Ancestors",
      "Trigger",
      "Transcendent",
      "Ultimate",
      "Rare",
      "Normal",
    ]);
    // In game, Ancestors share Transcendent's color and Trigger Ultimate's.
    expect(tiers.at(0)?.hex).toBe(rarityOf("Tier4")?.hex);
    expect(tiers.at(1)?.hex).toBe(rarityOf("Tier3")?.hex);
  });

  it("ranks a version by its own tier", () => {
    expect(versionTier({ tier: "Tier4", type: "Ancestors" }).rank).toBeLessThan(
      versionTier({ tier: "Tier4", type: null }).rank,
    );
  });
});
