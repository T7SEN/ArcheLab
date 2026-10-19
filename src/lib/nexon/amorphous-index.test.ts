import { describe, expect, it } from "vitest";
import {
  amorphousIndex,
  buildOf,
  patternKind,
  sourceText,
  type AmorphousSets,
  type BuildTargets,
} from "./amorphous-index";
import { imageHost } from "./metadata";
import type { MaterialRecord, ResearchRecord } from "./shared-sets";

/** A material shaped like NEXON's consumable-material.json (read 2026-10-17). */
const material = (
  id: string,
  name: string,
  extra: Partial<MaterialRecord> = {},
): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: [],
  material_type: "ResearchMaterial",
  ...extra,
});

const pattern = (
  id: string,
  name: string,
  reward: string,
  sources: string[] = [],
): MaterialRecord =>
  material(id, `Amorphous Material Pattern: ${name}`, {
    material_type: "AmorphousMaterial",
    amorphous_reward: [reward],
    acquisition_detail: sources,
  });

const research = (
  inputs: string[],
  result: { meta_type: string; meta_id: string },
): ResearchRecord => ({
  research_name: "Research",
  research_type: "Character",
  research_time: 10,
  research_cost: [],
  research_result: [result],
  research_material: inputs.map((id) => ({
    meta_type: "consumable_material_id",
    meta_id: id,
    material_count: 1,
  })),
});

const targets: BuildTargets = new Map([
  ["101000006", { kind: "descendant", slug: "bunny", name: "Bunny" }],
  [
    "101000019",
    { kind: "descendant", slug: "ultimate-bunny", name: "Ultimate Bunny" },
  ],
  [
    "11041001",
    { kind: "weapon", slug: "piercing-light", name: "Piercing Light" },
  ],
]);

const sets: AmorphousSets = {
  materials: [
    material("261021019", "Bunny Code"),
    material("261021161", "Ultimate Bunny Spiral Catalyst Blueprint"),
    material("261000001", "Piercing Light Nano Tube Blueprint"),
    material("261000002", "Crystallization Catalyst Blueprint"),
    material("261000003", "Bunny Enhanced Cells"),
    material("261000004", "Bunny Cell Fragment"),
    pattern("262050001", "Bunny", "364000001", [
      "MS:DungeonField:620210111:Normal",
      "MS:DungeonField:620210111:Normal:R",
      "unknown",
    ]),
    pattern("262052002", "Ultimate Ajax", "364000003"),
    pattern("262052001", "Albion Cavalry Gun", "364000002"),
    // Removed from the game, though NEXON still lists them (T7SEN, 2026-10-17).
    pattern("262051001", "001", "364000002"),
    pattern("262058106", "001-Variant AD", "364000002"),
    pattern("262059005", "001-Mutant AA", "364000002"),
    pattern("262050013", "Hagios Sheepdog", "364000003"),
    // Rewards NEXON doesn't list: left out.
    pattern("262050019", "Raven", "364000999"),
    // Not a pattern, though it opens into something.
    material("290001009", "Ultimate Bunny Research Material Bundle", {
      material_type: "Bundle",
      amorphous_reward: ["364000001"],
    }),
  ],
  rewards: [
    {
      amorphous_reward_id: "364000001",
      open_reward: [
        {
          reward_type: "Default",
          required_stabilizer: null,
          reward_item: [
            {
              meta_type: "consumable_material_id",
              meta_id: "261021019",
              rate: 100,
            },
          ],
        },
      ],
    },
    {
      amorphous_reward_id: "364000002",
      open_reward: [
        {
          reward_type: "Default",
          required_stabilizer: null,
          reward_item: [
            {
              meta_type: "consumable_material_id",
              meta_id: "261000001",
              rate: 38,
            },
            {
              meta_type: "consumable_material_id",
              meta_id: "261021161",
              rate: 38,
            },
            {
              meta_type: "consumable_material_id",
              meta_id: "261000002",
              rate: 15,
            },
            {
              meta_type: "consumable_material_id",
              meta_id: "261000004",
              rate: 6,
            },
            // An item NEXON doesn't list: left out.
            { meta_type: "consumable_material_id", meta_id: "999", rate: 3 },
          ],
        },
      ],
    },
    {
      amorphous_reward_id: "364000003",
      open_reward: [
        {
          reward_type: "Default",
          required_stabilizer: null,
          reward_item: [
            {
              meta_type: "consumable_material_id",
              meta_id: "261000002",
              rate: 20,
            },
          ],
        },
      ],
    },
  ],
  acquisitions: [
    {
      acquisition_detail_id: "MS:DungeonField:620210111:Normal",
      acquisition_detail_name:
        "[ Kingston ] [ Normal ] - [ Slumber Valley ] complete",
    },
    {
      acquisition_detail_id: "MS:DungeonField:620210111:Normal:R",
      acquisition_detail_name:
        "[ Kingston ] [ Normal ] - [ Slumber Valley ] Support Complete",
    },
  ],
  research: [
    // Bunny Code goes into Bunny's research.
    research(["261021019", "261000003"], {
      meta_type: "descendant_id",
      meta_id: "101000006",
    }),
    // A cell fragment makes Bunny's Enhanced Cells, a part of Bunny.
    research(["261000004"], {
      meta_type: "consumable_material_id",
      meta_id: "261000003",
    }),
  ],
};

describe("what an Amorphous Material's reward builds", () => {
  const build = (id: string, name: string) =>
    buildOf({ id, name }, sets.research, targets)?.slug ?? null;

  it("follows NEXON's research, directly or through a part", () => {
    expect(build("261021019", "Bunny Code")).toBe("bunny");
    expect(build("261000004", "Bunny Cell Fragment")).toBe("bunny");
  });

  it("reads a Blueprint's name, the longest build it starts with", () => {
    expect(build("261021161", "Ultimate Bunny Spiral Catalyst Blueprint")).toBe(
      "ultimate-bunny",
    );
    expect(build("261000001", "Piercing Light Nano Tube Blueprint")).toBe(
      "piercing-light",
    );
  });

  it("names none for a shared material", () => {
    expect(build("261000002", "Crystallization Catalyst Blueprint")).toBeNull();
  });

  it("falls back to the name when research names more than one", () => {
    const shared = [
      research(["5"], { meta_type: "descendant_id", meta_id: "101000006" }),
      research(["5"], { meta_type: "descendant_id", meta_id: "101000019" }),
    ];
    expect(
      buildOf({ id: "5", name: "Energy Activator" }, shared, targets),
    ).toBeNull();
    expect(
      buildOf({ id: "5", name: "Ultimate Bunny Code" }, shared, targets)?.slug,
    ).toBe("ultimate-bunny");
  });
});

describe("the Amorphous Materials index", () => {
  const { patterns } = amorphousIndex(sets, targets);

  it("lists the patterns in the game, highest tier first, then A–Z", () => {
    expect(patterns.map((entry) => [entry.name, entry.tier])).toEqual([
      ["Albion Cavalry Gun", "Tier3"],
      ["Ultimate Ajax", "Tier3"],
      ["Bunny", "Tier2"],
    ]);
    expect(patterns[0]?.slug).toBe("albion-cavalry-gun");
  });

  it("gives each its rewards, chances and builds in NEXON's order", () => {
    const albion = patterns.find(
      (entry) => entry.name === "Albion Cavalry Gun",
    );
    expect(
      albion?.rewards.map((reward) => [
        reward.name,
        reward.rate,
        reward.build?.slug,
      ]),
    ).toEqual([
      ["Piercing Light Nano Tube Blueprint", 38, "piercing-light"],
      ["Ultimate Bunny Spiral Catalyst Blueprint", 38, "ultimate-bunny"],
      ["Crystallization Catalyst Blueprint", 15, undefined],
      ["Bunny Cell Fragment", 6, "bunny"],
    ]);
  });

  it("names where it drops, as the game words it", () => {
    const bunny = patterns.find((entry) => entry.name === "Bunny");
    expect(bunny?.sources).toEqual([
      "[Kingston] [Normal] - [Slumber Valley] complete",
      "[Kingston] [Normal] - [Slumber Valley] Support Complete",
    ]);
    expect(patterns[0]?.sources).toEqual([]);
  });

  it("knows what each is for: what it is named after, else what its rewards build", () => {
    expect(patterns.map((entry) => [entry.name, entry.kind])).toEqual([
      // Not a weapon the targets know: most of its rewards are Descendants' parts.
      ["Albion Cavalry Gun", "descendant"],
      // Its one reward builds nothing.
      ["Ultimate Ajax", null],
      ["Bunny", "descendant"],
    ]);
    expect(patternKind("Piercing Light", [], targets)).toBe("weapon");
  });

  it("tidies NEXON's bracket padding and doubled spaces", () => {
    expect(sourceText("[ Operation Authorized ] Quest")).toBe(
      "[Operation Authorized] Quest",
    );
    expect(sourceText("[ Ultimate Equipment Research -  4 ] Quest")).toBe(
      "[Ultimate Equipment Research - 4] Quest",
    );
  });
});
