import { describe, expect, it } from "vitest";
import { moduleTierOf, rarityOf } from "./rarity";

describe("moduleTierOf", () => {
  it("gives Ancestor and Trigger modules their own tiers, in a rarity's color", () => {
    // In game, Ancestors share Transcendent's color and Trigger Ultimate's (T7SEN,
    // 2026-10-16). NEXON's data gives them Tier4 and Tier3, which mustn't decide it.
    expect(moduleTierOf("Tier1", "Ancestors")).toEqual({
      name: "Ancestors",
      hex: rarityOf("Tier4")?.hex,
    });
    expect(moduleTierOf("Tier1", "Trigger")).toEqual({
      name: "Trigger",
      hex: rarityOf("Tier3")?.hex,
    });
  });

  it("gives every other module its rarity", () => {
    expect(moduleTierOf("Tier4", null)).toEqual(rarityOf("Tier4"));
    expect(moduleTierOf("Tier2", "Multi-Hit Chance")?.name).toBe("Rare");
    expect(moduleTierOf("Tier9", null)).toBeNull();
  });
});
