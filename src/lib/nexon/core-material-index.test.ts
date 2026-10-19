import { describe, expect, it } from "vitest";
import type { AmorphousPattern } from "@/features/amorphous/amorphous-filters";
import type { BuildTargets } from "./amorphous-index";
import {
  coreMaterialIndex,
  type CoreMaterialSets,
} from "./core-material-index";
import { imageHost } from "./metadata";
import type { MaterialRecord, ResearchRecord } from "./shared-sets";

// Shaped like NEXON's consumable-material.json, research.json and acquisition-detail.json
// (read 2026-10-18). Ultimate Bunny Code (261021009) is one of the Library's Ultimate
// Core Materials; Archive Shard (261511013) is a basic material.
const material = (
  id: string,
  name: string,
  sources: string[] = [],
  type = "ResearchMaterial",
): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: sources,
  material_type: type,
});

const research = (
  type: string,
  inputs: string[],
  result: { meta_type: string; meta_id: string },
): ResearchRecord => ({
  research_name: "Research",
  research_type: type,
  research_time: 600,
  research_cost: [{ currency_type: "Gold", currency_value: 100 }],
  research_result: [result],
  research_material: inputs.map((id) => ({
    meta_type: "consumable_material_id",
    meta_id: id,
    material_count: 2,
  })),
});

const consumable = (id: string) => ({
  meta_type: "consumable_material_id",
  meta_id: id,
});

const mission = "MM:BaseMission:620101001:Hard";

const sets: CoreMaterialSets = {
  materials: [
    material("261511013", "Archive Shard"),
    material("261021009", "Ultimate Bunny Code"),
    material("261000001", "Ultimate Bunny Enhanced Cells", [
      "AM:262000001",
      "RS",
      mission,
    ]),
    material("262060099", "Energy Activator Blueprint"),
    material("262060000", "Energy Activator"),
    material("263000123", "Not a Blueprint", [], "OtherMaterials"),
  ],
  research: [
    // Ultimate Bunny, from her Code and her Enhanced Cells.
    research("Character", ["261021009", "261000001"], {
      meta_type: "descendant_id",
      meta_id: "101000019",
    }),
    // Her Enhanced Cells, from a basic material.
    research("CharacterMaterial", ["261511013"], consumable("261000001")),
    // An Enhancement Material: its Blueprint counts, a non-research input doesn't.
    research(
      "UpgradeMaterial",
      ["262060099", "261511013", "263000123"],
      consumable("262060000"),
    ),
  ],
  acquisitions: [
    {
      acquisition_detail_id: "AM:262000001",
      acquisition_detail_name: "[Amorphous Material Pattern: 120]",
    },
    {
      acquisition_detail_id: "RS",
      acquisition_detail_name: "Obtainable through Research",
    },
    {
      acquisition_detail_id: mission,
      acquisition_detail_name:
        "[ Kingston ] [ Hard ] - [ Urban District ] Mission Monster",
    },
  ],
  placeHrefs: new Map([
    [mission, "/difficulty-level-rewards?battlefield=the-destruction"],
  ]),
};

const targets: BuildTargets = new Map([
  [
    "101000019",
    { kind: "descendant", slug: "ultimate-bunny", name: "Ultimate Bunny" },
  ],
]);

const pattern = (
  name: string,
  rewards: { id: string; rate: number }[],
): AmorphousPattern => ({
  slug: name.toLowerCase(),
  name,
  tier: "Tier3",
  kind: "descendant",
  imageUrl: "",
  rewards: rewards.map((reward) => ({
    ...reward,
    name: "",
    imageUrl: "",
    build: null,
    href: null,
  })),
  sources: [],
});

const patterns = [
  pattern("120", [{ id: "261000001", rate: 6 }]),
  pattern("041", [{ id: "261000001", rate: 38 }]),
];

describe("coreMaterialIndex", () => {
  const items = coreMaterialIndex(sets, targets, patterns);
  const byName = (name: string) => items.find((item) => item.name === name);

  it("lists what build research and Blueprints take, Ultimate first, then A to Z", () => {
    expect(items.map((item) => [item.name, item.tier])).toEqual([
      ["Ultimate Bunny Code", "Tier3"],
      ["Energy Activator Blueprint", "Tier2"],
      ["Ultimate Bunny Enhanced Cells", "Tier2"],
    ]);
  });

  it("names what each goes into", () => {
    expect(byName("Ultimate Bunny Code")?.uses).toEqual([
      { kind: "descendant", slug: "ultimate-bunny", name: "Ultimate Bunny" },
    ]);
    expect(byName("Energy Activator Blueprint")?.uses).toEqual([
      {
        kind: "enhancement",
        slug: "energy-activator",
        name: "Energy Activator",
      },
    ]);
  });

  it("gives a part its recipe, with its ingredients' pages", () => {
    const cells = byName("Ultimate Bunny Enhanced Cells");
    expect(cells?.recipe?.time).toBe(600);
    expect(
      cells?.recipe?.items.map((item) => [item.name, item.count, item.href]),
    ).toEqual([
      ["Archive Shard", 2, "/basic-materials?material=archive-shard"],
    ]);
    expect(byName("Ultimate Bunny Code")?.recipe).toBeNull();
  });

  it("lists the patterns that give it, highest chance first", () => {
    expect(byName("Ultimate Bunny Enhanced Cells")?.patterns).toEqual([
      { slug: "041", name: "041", rate: 38 },
      { slug: "120", name: "120", rate: 6 },
    ]);
  });

  it("keeps its drop places but the pattern and research ones, and links them", () => {
    const cells = byName("Ultimate Bunny Enhanced Cells");
    expect(cells?.sources).toEqual([
      "[Kingston] [Hard] - [Urban District] Mission Monster",
    ]);
    expect(cells?.placeLinks).toEqual({
      "[Kingston] [Hard] - [Urban District] Mission Monster":
        "/difficulty-level-rewards?battlefield=the-destruction",
    });
    expect(byName("Ultimate Bunny Code")).not.toHaveProperty("placeLinks");
  });

  it("is empty when NEXON's sets are", () => {
    expect(
      coreMaterialIndex(
        { materials: [], research: [], acquisitions: [] },
        targets,
        [],
      ),
    ).toEqual([]);
  });
});
