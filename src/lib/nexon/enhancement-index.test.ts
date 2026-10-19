import { describe, expect, it } from "vitest";
import { enhancementIndex, type EnhancementSets } from "./enhancement-index";
import { imageHost } from "./metadata";
import type { MaterialRecord, ResearchRecord } from "./shared-sets";

/** A material shaped like NEXON's consumable-material.json (read 2026-10-17). */
const material = (
  id: string,
  name: string,
  sources: string[] = [],
): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: sources,
  material_type: "ResearchMaterial",
});

const upgrade = (
  result: string,
  inputs: [string, number][],
  type = "UpgradeMaterial",
): ResearchRecord => ({
  research_name: "Research",
  research_type: type,
  research_time: 60,
  research_cost: [{ currency_type: "Gold", currency_value: 1000 }],
  research_result: [{ meta_type: "consumable_material_id", meta_id: result }],
  research_material: inputs.map(([id, count]) => ({
    meta_type: "consumable_material_id",
    meta_id: id,
    material_count: count,
  })),
});

const sets: EnhancementSets = {
  materials: [
    material("262060000", "Ion Accelerator", ["RS", "QS:1"]),
    material("262020001", "Core Binder"),
    material("262031018", "Solenoid"),
    material("261021175", "Nano Compound"),
    material("261511012", "Void Abyss Metal Fragment"),
    material("263000001", "Bunny Code"),
  ],
  research: [
    upgrade("262060000", [["262031018", 50]]),
    upgrade("262060000", [["261021175", 50]]),
    upgrade("262020001", [["261511012", 2000]]),
    // Not an Enhancement Material: a Descendant part.
    upgrade("263000001", [["262031018", 1]], "CharacterMaterial"),
  ],
  acquisitions: [
    {
      acquisition_detail_id: "RS",
      acquisition_detail_name: "Obtainable through Research",
    },
    {
      acquisition_detail_id: "QS:1",
      acquisition_detail_name: "[ The Stance of the Magisters ] Quest",
    },
  ],
};

describe("enhancementIndex", () => {
  const index = enhancementIndex(sets);

  it("lists each item made by UpgradeMaterial research, in the game's order", () => {
    // Core Binder (Ultimate) comes before Ion Accelerator (Normal).
    expect(index.map((item) => item.name)).toEqual([
      "Core Binder",
      "Ion Accelerator",
    ]);
  });

  it("gives an item every way to research it, with its tier and description", () => {
    const ion = index.find((item) => item.slug === "ion-accelerator");
    expect(ion?.tier).toBe("Tier1");
    expect(ion?.description).toMatch(/^A unique equipment/);
    expect(
      ion?.recipes.map((recipe) =>
        recipe.items.map((item) => [item.name, item.count, item.href]),
      ),
    ).toEqual([
      [["Solenoid", 50, "/basic-materials?material=solenoid"]],
      [["Nano Compound", 50, "/basic-materials?material=nano-compound"]],
    ]);
  });

  it("uses the game's count where it differs from NEXON's: Core Binder takes 20,000", () => {
    const binder = index.find((item) => item.slug === "core-binder");
    expect(binder?.recipes.at(0)?.items.at(0)?.count).toBe(20_000);
  });

  it("lists where an item also drops, but not 'Obtainable through Research'", () => {
    const ion = index.find((item) => item.slug === "ion-accelerator");
    expect(ion?.sources).toEqual(["[The Stance of the Magisters] Quest"]);
  });
});
