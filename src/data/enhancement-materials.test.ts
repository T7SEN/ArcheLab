import { describe, expect, it } from "vitest";
import {
  enhancementMaterials,
  ingredientCounts,
} from "./enhancement-materials";

describe("the enhancement materials list", () => {
  it("holds the 23 items, each once, with a description", () => {
    expect(enhancementMaterials).toHaveLength(23);
    expect(new Set(enhancementMaterials.map((item) => item.name)).size).toBe(
      23,
    );
    for (const item of enhancementMaterials) {
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it("runs in the game's order: Ultimate, then Rare, then Normal", () => {
    const tiers = enhancementMaterials.map((item) => item.tier);
    expect(tiers).toEqual([...tiers].sort().reverse());
  });

  it("corrects counts only for items it lists (T7SEN's Core Binder screenshot)", () => {
    const names = enhancementMaterials.map((item) => item.name);
    for (const entry of ingredientCounts) {
      expect(names).toContain(entry.result);
    }
    expect(ingredientCounts).toContainEqual({
      result: "Core Binder",
      ingredient: "Void Abyss Metal Fragment",
      count: 20_000,
    });
  });
});
