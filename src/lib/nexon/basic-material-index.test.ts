import { describe, expect, it } from "vitest";
import type { BuildTargets } from "./amorphous-index";
import {
  basicMaterialIndex,
  usesOf,
  type BasicSets,
} from "./basic-material-index";
import { imageHost } from "./metadata";
import type { MaterialRecord, ResearchRecord } from "./shared-sets";

/** A material shaped like NEXON's consumable-material.json (read 2026-10-18). */
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

const research = (
  type: string,
  inputs: string[],
  result: { meta_type: string; meta_id: string },
): ResearchRecord => ({
  research_name: "Research",
  research_type: type,
  research_time: 10,
  research_cost: [],
  research_result: [result],
  research_material: inputs.map((id) => ({
    meta_type: "consumable_material_id",
    meta_id: id,
    material_count: 1,
  })),
});

const part = (id: string) => ({
  meta_type: "consumable_material_id",
  meta_id: id,
});

const targets: BuildTargets = new Map([
  [
    "101000019",
    { kind: "descendant", slug: "ultimate-bunny", name: "Ultimate Bunny" },
  ],
  [
    "11041001",
    { kind: "weapon", slug: "piercing-light", name: "Piercing Light" },
  ],
  ["105000001", { kind: "vehicle", slug: "orca", name: "Orca" }],
]);

// Archive Shard (261511013) and Silentra (261521218) are basic materials; the rest are
// parts and Enhancement Materials.
const sets: BasicSets = {
  materials: [
    material("261511013", "Archive Shard", ["MS:Vespers:1:Hard", "missing"]),
    material("261521218", "Silentra"),
    material("261000001", "Ultimate Bunny Enhanced Cells"),
    material("262060000", "Ion Accelerator"),
  ],
  research: [
    // A part of Ultimate Bunny, researched from Archive Shard.
    research("CharacterMaterial", ["261511013"], part("261000001")),
    research("Character", ["261000001"], {
      meta_type: "descendant_id",
      meta_id: "101000019",
    }),
    // Piercing Light, researched from Archive Shard directly.
    research("Equipment", ["261511013"], {
      meta_type: "weapon_id",
      meta_id: "11041001",
    }),
    // An Enhancement Material.
    research("UpgradeMaterial", ["261511013"], part("262060000")),
    // Orca, from Silentra.
    research("Vehicle", ["261521218"], {
      meta_type: "vehicle_id",
      meta_id: "105000001",
    }),
  ],
  acquisitions: [
    {
      acquisition_detail_id: "MS:Vespers:1:Hard",
      acquisition_detail_name: "[ Vespers ] [ Hard ] - [ Sepulcher ]  complete",
    },
  ],
};

describe("usesOf", () => {
  it("names each Descendant, weapon, Enhancement Material and vehicle it goes into", () => {
    expect(usesOf("261511013", sets, targets)).toEqual([
      { kind: "descendant", slug: "ultimate-bunny", name: "Ultimate Bunny" },
      { kind: "weapon", slug: "piercing-light", name: "Piercing Light" },
      { kind: "enhancement", slug: "ion-accelerator", name: "Ion Accelerator" },
    ]);
    expect(usesOf("261521218", sets, targets)).toEqual([
      { kind: "vehicle", slug: "orca", name: "Orca" },
    ]);
  });

  it("gives nothing for a material no research takes", () => {
    expect(usesOf("999", sets, targets)).toEqual([]);
  });
});

describe("basicMaterialIndex", () => {
  const index = basicMaterialIndex(sets, targets);

  it("lists the game's basic materials NEXON has, in the game's order", () => {
    // Archive Shard is Ultimate, Silentra Rare (src/data/basic-materials.ts).
    expect(index.map((item) => [item.name, item.tier])).toEqual([
      ["Archive Shard", "Tier3"],
      ["Silentra", "Tier2"],
    ]);
  });

  it("gives each its art, description, uses and drop places as the game words them", () => {
    const shard = index.at(0);
    expect(shard?.slug).toBe("archive-shard");
    expect(shard?.imageUrl).toBe(`${imageHost}261511013`);
    expect(shard?.description).toMatch(/^A material used for research\./);
    expect(shard?.uses).toHaveLength(3);
    // Bracket padding and doubled spaces gone; an id NEXON doesn't name is left out.
    expect(shard?.sources).toEqual(["[Vespers] [Hard] - [Sepulcher] complete"]);
    expect(index.at(1)?.sources).toEqual([]);
  });
});

describe("links to other pages (ADR 0050)", () => {
  const linked = basicMaterialIndex(
    {
      ...sets,
      materials: [...sets.materials, material("261521228", "Xeno Fluid")],
      placeHrefs: new Map([
        [
          "MS:Vespers:1:Hard",
          "/difficulty-level-rewards?battlefield=the-ruins",
        ],
      ]),
    },
    targets,
  );
  const byName = (name: string) => linked.find((item) => item.name === name);

  it("links a drop place that has a page", () => {
    const shard = byName("Archive Shard");
    const place = shard?.sources.at(0) ?? "";
    expect(place).toBe("[Vespers] [Hard] - [Sepulcher] complete");
    expect(shard?.placeLinks).toEqual({
      [place]: "/difficulty-level-rewards?battlefield=the-ruins",
    });
    expect(byName("Silentra")).not.toHaveProperty("placeLinks");
  });

  it("names the Miscellaneous item of the same name", () => {
    expect(byName("Xeno Fluid")?.miscTwin).toBe("xeno-fluid");
    expect(byName("Archive Shard")).not.toHaveProperty("miscTwin");
  });
});
