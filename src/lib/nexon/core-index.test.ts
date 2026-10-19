import { describe, expect, it } from "vitest";
import type { ComponentGroup, ComponentPiece } from "./component-index";
import { coreIndex, type CoreIndexSets } from "./core-index";
import type { CoreTypeRecord } from "./core-types";
import { imageHost } from "./metadata";
import type { MaterialRecord } from "./shared-sets";
import type { WeaponSummary } from "./weapon-page";

/** Shaped like NEXON's core-type.json, core-slot.json and their neighbors (2026-10-18). */
const option = (
  name: string,
  grade: number,
  operator = "Multiply",
): CoreTypeRecord["core_option"][number]["detail"][number]["available_item_option"][number] => ({
  item_option: name,
  option_grade: grade,
  option_effect: {
    operator_type: operator,
    min_stat_value: 0.1 * grade,
    max_stat_value: 0.2 * grade,
  },
});

/** A set of two grades, each taking the core item with that id prefix and grade. */
const set = (id: string, item: string, roll: string, operator?: string) => ({
  core_option_id: id,
  detail: [1, 2].map((grade) => ({
    required_core_item: {
      meta_type: "consumable_material_id",
      meta_id: `${item}00${String(grade)}`,
    },
    available_item_option: [option(roll, grade, operator)],
  })),
});

const firearmFirepower = set("383000101", "265101", "Firearm ATK");
const launcherFirepower = set("383000102", "265101", "Explosive ATK");
const meleeFirepower = set("383000103", "265101", "Melee Weapon ATK");
const firearmHit = set("383000301", "265107", "Multi-Hit Chance", "Add");
const recovery = set("383010101", "265208", "Max HP");

const coreType = (
  id: string,
  name: string,
  sets: CoreTypeRecord["core_option"],
): CoreTypeRecord => ({ core_type_id: id, core_type: name, core_option: sets });

const coreTypes = [
  coreType("382000101", "Firepower Augmentation", [firearmFirepower]),
  coreType("382000102", "Firepower Augmentation", [launcherFirepower]),
  // No slot takes it: left out.
  coreType("382000103", "Firepower Augmentation", [meleeFirepower]),
  coreType("382000301", "Hit Augmentation", [firearmHit]),
  coreType("382009901", "Free Augmentation", [firearmFirepower, firearmHit]),
  coreType("382009902", "Free Augmentation", [launcherFirepower, firearmHit]),
  coreType("382010101", "Recovery Augmentation", [recovery]),
];

const material = (
  id: string,
  name: string,
  sources: string[] = [],
): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: sources,
  material_type: "CoreItem",
});

const weapon = (name: string, type: string): WeaponSummary => ({
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  imageUrl: `${imageHost}${name}`,
  tier: "Tier3",
  type,
  rounds: null,
});

const piece = (id: string, tier: string): ComponentPiece => ({
  id,
  name: `Piece ${id}`,
  slot: "Sensor",
  tier,
  imageUrl: `${imageHost}${id}`,
  stat: null,
  coreSlots: tier === "Tier3" ? 2 : 0,
  levels: [],
});

const group = (
  name: string,
  pieces: ComponentPiece[],
  kind: ComponentGroup["kind"] = "set",
): ComponentGroup => ({
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  kind,
  bonuses: [],
  pieces,
});

const sets: CoreIndexSets = {
  coreTypes,
  coreSlots: [
    {
      core_slot_id: "381000001",
      available_weapon_id: ["1"],
      available_external_component_id: [],
      available_core_type_id: [
        "382009901",
        "382000101",
        "382000101",
        "382000301",
        "382000301",
      ],
    },
    {
      core_slot_id: "381000023",
      available_weapon_id: ["2"],
      available_external_component_id: [],
      available_core_type_id: ["382009902", "382009902", "382000102"],
    },
    {
      core_slot_id: "381010001",
      available_weapon_id: [],
      available_external_component_id: ["c1", "c2"],
      available_core_type_id: ["382010101"],
    },
    {
      core_slot_id: "381010002",
      available_weapon_id: [],
      available_external_component_id: ["c2", "c3"],
      available_core_type_id: ["382010101"],
    },
  ],
  materials: [
    material("265101001", "Firepower Augmentation Core I", ["QS:630500235"]),
    material("265101002", "Firepower Augmentation Core II", [
      "CC",
      "CC",
      "MS:VoidErosion:1:Challenge",
      "unknown",
    ]),
    material("265107001", "Hit Augmentation Core (Variant AB) I"),
    material("265107002", "Hit Augmentation Core (Variant AB) II"),
    // The plain Hit core a firearm's Hit slot also takes (`weaponCoreAlsoTakes`).
    material("265103001", "Hit Augmentation Core I", ["QS:630500235"]),
    material("265103002", "Hit Augmentation Core II"),
    material("265208001", "Recovery Augmentation Core (Variant AB) I"),
    material("265208002", "Recovery Augmentation Core (Variant AB) II"),
  ],
  acquisitions: [
    {
      acquisition_detail_id: "QS:630500235",
      acquisition_detail_name: "[ Learning to equip Cores ] Quest",
    },
    {
      acquisition_detail_id: "CC",
      acquisition_detail_name: "Acquired via Craft Core",
    },
    {
      acquisition_detail_id: "MS:VoidErosion:1:Challenge",
      acquisition_detail_name:
        "[ Void Erosion Purge ] [ Challenge ] - [ Stage 1 ]",
    },
  ],
  weaponSlots: new Map([
    ["Ancient Knight", ["381000001"]],
    ["Sigvore's Proof", ["381000023"]],
  ]),
  weapons: [
    weapon("Sigvore's Proof", "Launcher"),
    weapon("Ancient Knight", "Assault Rifle"),
  ],
  componentGroups: [
    group(
      "HP Support",
      [piece("c1", "Tier3"), piece("h1", "Tier1")],
      "standalone",
    ),
    group("Shell Crusher", [piece("c2", "Tier3"), piece("c3", "Tier3")]),
    group("Supernova", [piece("s1", "Tier2")]),
  ],
};

const kinds = coreIndex(sets);
const kindOf = (slug: string) => {
  const found = kinds.find((kind) => kind.slug === slug);
  if (found === undefined) {
    throw new Error(`no ${slug} card`);
  }
  return found;
};

describe("the Cores index from NEXON's sets", () => {
  it("makes one card per kind a slot takes, in NEXON's id order", () => {
    expect(kinds.map((kind) => [kind.slug, kind.name, kind.equipment])).toEqual(
      [
        ["firepower", "Firepower Augmentation", "weapons"],
        ["hit", "Hit Augmentation", "weapons"],
        ["recovery", "Recovery Augmentation", "components"],
      ],
    );
  });

  it("keeps the versions some slot takes, with the weapon types that take each", () => {
    expect(
      kindOf("firepower").versions.map((version) => [
        version.id,
        version.weaponTypes,
        version.grades.at(-1)?.options.map((entry) => entry.name),
      ]),
    ).toEqual([
      ["382000101", ["Assault Rifle"], ["Firearm ATK"]],
      ["382000102", ["Launcher"], ["Explosive ATK"]],
    ]);
    // Both weapons' Free slots take the firearm Hit set.
    expect(
      kindOf("hit").versions.map((version) => version.weaponTypes),
    ).toEqual([["Assault Rifle", "Launcher"]]);
  });

  it("lists each weapon with its slots that take the kind, by type", () => {
    expect(
      kindOf("firepower").weapons.map((entry) => [
        entry.name,
        entry.type,
        entry.slots,
      ]),
    ).toEqual([
      ["Ancient Knight", "Assault Rifle", ["Free", "Firepower", "Firepower"]],
      ["Sigvore's Proof", "Launcher", ["Free", "Free", "Firepower"]],
    ]);
    expect(kindOf("hit").weapons.map((entry) => entry.slots)).toEqual([
      ["Free", "Hit", "Hit"],
      ["Free", "Free"],
    ]);
  });

  it("names where each grade's core items drop, each place once", () => {
    const firepower = kindOf("firepower");
    expect(firepower.drops.map((entry) => entry.grade)).toEqual([1, 2]);
    expect(firepower.drops.at(1)?.items).toEqual([
      {
        name: "Firepower Augmentation Core II",
        imageUrl: `${imageHost}265101002`,
        sources: [
          "Acquired via Craft Core",
          "[Void Erosion Purge] [Challenge] - [Stage 1]",
        ],
      },
    ]);
    expect(firepower.imageUrl).toBe(`${imageHost}265101002`);
  });

  it("adds the plain Hit core a firearm's Hit slot also takes", () => {
    expect(
      kindOf("hit")
        .drops.at(0)
        ?.items.map((item) => [item.name, item.sources]),
    ).toEqual([
      ["Hit Augmentation Core (Variant AB) I", []],
      ["Hit Augmentation Core I", ["[Learning to equip Cores] Quest"]],
    ]);
  });

  it("counts the external components and links their cards at their tier", () => {
    const kind = kindOf("recovery");
    expect(kind.weapons).toEqual([]);
    expect(kind.componentCards).toEqual([
      { slug: "hp-support", name: "HP Support", set: false, tier: "Ultimate" },
      {
        slug: "shell-crusher",
        name: "Shell Crusher",
        set: true,
        tier: "Ultimate",
      },
    ]);
    expect(kindOf("firepower").componentCards).toEqual([]);
  });

  it("has no cards when NEXON's sets can't be loaded", () => {
    expect(
      coreIndex({
        ...sets,
        coreTypes: [],
        coreSlots: [],
      }),
    ).toEqual([]);
  });
});

describe("plain cores and place links (ADR 0050)", () => {
  const shelter = "MS:DungeonField:620130100:Hard_400";
  const linked = coreIndex({
    ...sets,
    materials: [
      ...sets.materials,
      material("265201002", "Recovery Augmentation Core II", [shelter, "CC"]),
    ],
    acquisitions: [
      ...sets.acquisitions,
      {
        acquisition_detail_id: shelter,
        acquisition_detail_name: "[Vespers] [Hard] - [The Shelter] complete",
      },
    ],
    placeHrefs: new Map([[shelter, "/infiltration-400?operation=the-shelter"]]),
  });

  it("lists Recovery's plain core of a grade beside the Variant AB one, with links", () => {
    const recovery = linked.find((kind) => kind.slug === "recovery");
    expect(recovery?.drops.map((entry) => entry.items)).toEqual([
      [
        {
          name: "Recovery Augmentation Core (Variant AB) I",
          imageUrl: `${imageHost}265208001`,
          sources: [],
        },
      ],
      [
        {
          name: "Recovery Augmentation Core (Variant AB) II",
          imageUrl: `${imageHost}265208002`,
          sources: [],
        },
        {
          name: "Recovery Augmentation Core II",
          imageUrl: `${imageHost}265201002`,
          sources: [
            "[Vespers] [Hard] - [The Shelter] complete",
            "Acquired via Craft Core",
          ],
          placeLinks: {
            "[Vespers] [Hard] - [The Shelter] complete":
              "/infiltration-400?operation=the-shelter",
          },
        },
      ],
    ]);
  });

  it("adds no plain cores to other kinds", () => {
    const firepower = linked.find((kind) => kind.slug === "firepower");
    expect(firepower?.drops.flatMap((entry) => entry.items).length).toBe(2);
  });
});
