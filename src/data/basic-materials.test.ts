import { describe, expect, it } from "vitest";
import { basicMaterials } from "./basic-materials";

describe("the basic materials list", () => {
  it("holds the 65 of the game's Basic tab, each once", () => {
    expect(basicMaterials).toHaveLength(65);
    expect(new Set(basicMaterials.map((item) => item.id)).size).toBe(65);
    expect(new Set(basicMaterials.map((item) => item.name)).size).toBe(65);
  });

  it("has T7SEN's tiers: 4 Ultimate, 31 Rare and 30 Normal", () => {
    const count = (tier: string) =>
      basicMaterials.filter((item) => item.tier === tier).length;
    expect([count("Tier3"), count("Tier2"), count("Tier1")]).toEqual([
      4, 31, 30,
    ]);
  });

  it("runs in the game's order: highest tier first, then newest id first", () => {
    const sorted = [...basicMaterials].sort(
      (a, b) => b.tier.localeCompare(a.tier) || Number(b.id) - Number(a.id),
    );
    expect(basicMaterials.map((item) => item.name)).toEqual(
      sorted.map((item) => item.name),
    );
    expect(basicMaterials.at(0)?.name).toBe("Transcendent Trait Element");
    expect(basicMaterials.at(-1)?.name).toBe("Repton");
  });

  it("gives each one a description with no doubled spaces", () => {
    for (const item of basicMaterials) {
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.description).not.toMatch(/ {2}/);
    }
  });
});
