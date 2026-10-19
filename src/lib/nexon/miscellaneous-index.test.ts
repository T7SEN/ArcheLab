import { describe, expect, it } from "vitest";
import { imageHost } from "./metadata";
import { miscellaneousIndex } from "./miscellaneous-index";
import type { AcquisitionRecord, MaterialRecord } from "./shared-sets";

// Shaped like NEXON's consumable-material.json and acquisition-detail.json (read
// 2026-10-18). The ids are the Library's; NEXON's data names the items the same.
const material = (
  id: string,
  name: string,
  sources: string[],
): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: sources,
  material_type: "OtherMaterials",
});

const place = (id: string, name: string): AcquisitionRecord => ({
  acquisition_detail_id: id,
  acquisition_detail_name: name,
});

const acquisitions = [
  place(
    "MS:DungeonField:620130100:Hard_400",
    "[Vespers] [Hard] - [The Shelter] complete",
  ),
  place(
    "MS:DungeonField:620120107:Hard",
    "[Vespers] [Hard] - [The Shelter] complete",
  ),
  place(
    "MS:DungeonField:620330101:Hard",
    "[Agna Desert] [Hard] - [Caligo Ossuary] complete",
  ),
  place(
    "MM:BaseMission:620101001:Hard",
    "[Kingston] [Hard] - [Urban District] Mission Monster",
  ),
  place("TC:TrialMode", "[Trials] - [Round Completion Rewards]"),
];

const materials = [
  // Two of Transcendent Weapon Loot's 32 boxes: the one found in more places gives the
  // card its art.
  material("269020029", "Transcendent Weapon Loot", ["TC:TrialMode"]),
  material("269020016", "Transcendent Weapon Loot", [
    "MS:DungeonField:620130100:Hard_400",
    "MS:DungeonField:620330101:Hard",
  ]),
  material("263011002", "Code Breaker", ["MM:BaseMission:620101001:Hard"]),
  // A Hard-only drop at a place whose 400% one has a page.
  material("263080002", "Collectible Coin", ["MS:DungeonField:620120107:Hard"]),
  material("269020028", "Xeno Fluid", []),
];

const placeHrefs = new Map([
  [
    "MS:DungeonField:620130100:Hard_400",
    "/infiltration-400?operation=the-shelter",
  ],
  [
    "MM:BaseMission:620101001:Hard",
    "/difficulty-level-rewards?battlefield=grand-square",
  ],
]);

describe("miscellaneousIndex", () => {
  const items = miscellaneousIndex({ materials, acquisitions, placeHrefs });
  const byName = (name: string) => items.find((item) => item.name === name);

  it("lists the Library's items NEXON has, in the Library's order", () => {
    expect(items.map((item) => item.name)).toEqual([
      "Transcendent Weapon Loot",
      "Xeno Fluid",
      "Code Breaker",
      "Collectible Coin",
    ]);
    expect(items.map((item) => item.tier)).toEqual([
      "Tier3",
      "Tier3",
      "Tier1",
      "Tier1",
    ]);
  });

  it("shows Transcendent Weapon Loot once, with every box's places in id order", () => {
    expect(byName("Transcendent Weapon Loot")).toEqual({
      slug: "transcendent-weapon-loot",
      name: "Transcendent Weapon Loot",
      tier: "Tier3",
      imageUrl: `${imageHost}269020016`,
      sources: [
        "[Vespers] [Hard] - [The Shelter] complete",
        "[Agna Desert] [Hard] - [Caligo Ossuary] complete",
        "[Trials] - [Round Completion Rewards]",
      ],
      placeLinks: {
        "[Vespers] [Hard] - [The Shelter] complete":
          "/infiltration-400?operation=the-shelter",
      },
      gives: {
        name: "Transcendent weapons",
        href: "/weapons?tier=Transcendent",
      },
      basicTwin: null,
    });
  });

  it("links a place by its id, so a Hard-only drop doesn't open the 400% page", () => {
    expect(byName("Code Breaker")?.placeLinks).toEqual({
      "[Kingston] [Hard] - [Urban District] Mission Monster":
        "/difficulty-level-rewards?battlefield=grand-square",
    });
    expect(byName("Collectible Coin")?.placeLinks).toEqual({});
  });

  it("names the Basic Material of the same name", () => {
    expect(byName("Xeno Fluid")).toMatchObject({
      basicTwin: "xeno-fluid",
      sources: [],
      gives: null,
    });
  });
});
