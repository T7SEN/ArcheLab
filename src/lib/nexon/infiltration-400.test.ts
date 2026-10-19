import { afterAll, describe, expect, it, vi } from "vitest";
import { infiltration400, operation400Places } from "./infiltration-400";
import { imageHost } from "./metadata";
import type { AcquisitionRecord, MaterialRecord } from "./shared-sets";

// Shaped like NEXON's acquisition-detail.json and consumable-material.json (read
// 2026-10-18): a 400% place's name says "[Hard]", as the Hard one's does.
const place = (id: string, name: string): AcquisitionRecord => ({
  acquisition_detail_id: id,
  acquisition_detail_name: name,
});

const acquisitions = [
  place(
    "MS:DungeonField:620130100:Hard_400",
    "[ Vespers ] [ Hard ] - [ The Shelter ] complete",
  ),
  place(
    "MM:DungeonField:620130100:Hard_400",
    "[Vespers] [Hard] - [The Shelter] Mission Monster",
  ),
  place(
    "MS:DungeonField:620330100:Hard_400",
    "[Agna Desert] [Hard] - [The Asylum] complete",
  ),
  place(
    "MS:DungeonField:620530100:Hard_400",
    "[Fortress] [Hard] - [Heart of the Fortress] complete",
  ),
  // The Hard one, with the same name.
  place(
    "MS:DungeonField:620120107:Hard",
    "[Vespers] [Hard] - [The Shelter] complete",
  ),
];

const material = (
  id: string,
  name: string,
  type: string,
  sources: string[],
): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: sources,
  material_type: type,
});

const materials = [
  material("263080002", "Collectible Coin", "CollectibleShopCoin", [
    "MS:DungeonField:620130100:Hard_400",
  ]),
  material("265202010", "Defense Augmentation Core X", "CoreItem", [
    "MM:DungeonField:620130100:Hard_400",
  ]),
  material("261511013", "Archive Shard", "ResearchMaterial", [
    "MS:DungeonField:620130100:Hard_400",
    "MM:DungeonField:620130100:Hard_400",
    "MS:DungeonField:620120107:Hard",
  ]),
  material("263999999", "Hard Only", "OtherMaterials", [
    "MS:DungeonField:620120107:Hard",
  ]),
];

// The cycle names operations this test has no places for: each warns, as at build.
// Vitest clears a spy's calls before each test, and these warnings come while the file
// loads: they're kept in a list of their own.
const warnings: string[] = [];
const warn = vi
  .spyOn(console, "warn")
  .mockImplementation((...args: unknown[]) => {
    warnings.push(args.map(String).join(" "));
  });
afterAll(() => {
  warn.mockRestore();
});

describe("infiltration400", () => {
  const operations = infiltration400({
    acquisitions,
    materials,
    research: [],
    itemHrefs: new Map([
      ["Defense Augmentation Core X", "/cores?core=defense"],
    ]),
  });

  it("finds every operation with a 400% place, in region order", () => {
    expect(
      operations.map((operation) => [
        operation.slug,
        operation.region,
        operation.inCycle,
      ]),
    ).toEqual([
      ["the-shelter", "Vespers", true],
      ["the-asylum", "Agna Desert", true],
      ["heart-of-the-fortress", "Fortress", false],
    ]);
  });

  it("gives each its Transcendent weapon chance, matched without a leading The", () => {
    expect(operations[0]?.transcendent).toEqual({
      chance: "2.17%",
      min: 101,
      max: 250,
    });
    // Update 1.4.0 writes "Asylum".
    expect(operations[1]?.transcendent?.chance).toBe("2.92%");
  });

  it("lists what drops there at 400%, materials then cores, with each way and page", () => {
    expect(operations[0]?.drops).toEqual([
      {
        name: "Archive Shard",
        imageUrl: `${imageHost}261511013`,
        kind: "material",
        href: "/basic-materials?material=archive-shard",
        ways: ["complete", "Mission Monster"],
      },
      {
        name: "Collectible Coin",
        imageUrl: `${imageHost}263080002`,
        kind: "material",
        href: "/miscellaneous?item=collectible-coin",
        ways: ["complete"],
      },
      {
        name: "Defense Augmentation Core X",
        imageUrl: `${imageHost}265202010`,
        kind: "core",
        href: "/cores?core=defense",
        ways: ["Mission Monster"],
      },
    ]);
  });
});

describe("an operation's modules, reactor and external component sets", () => {
  // The Shelter's lists in src/data/infiltration-400-equipment.ts (tfdhub's, read
  // 2026-10-19). Enlightened Mage is left out of the links, as a name NEXON's data
  // lacked would be.
  const link = (name: string, slug: string) => ({
    name,
    slug,
    imageUrl: `${imageHost}${slug}`,
  });
  const shelter = infiltration400({
    acquisitions,
    materials,
    research: [],
    itemHrefs: new Map(),
    equipment: {
      modules: new Map(
        [
          "Explosive Evade",
          "Release Cutting Force",
          "Turret Engineering",
          "Water Play",
        ].map((name) => [
          name,
          link(name, name.toLowerCase().replace(/ /g, "-")),
        ]),
      ),
      reactors: new Map([
        [
          "Burning Phase Reactor",
          link("Burning Phase Reactor", "burning-phase-reactor"),
        ],
      ]),
      // By the pieces' name; the set's own name can differ.
      componentSets: new Map([
        ["Annihilation", link("Annihilation Set", "annihilation")],
      ]),
    },
  }).at(0);
  const gear = (shelter?.drops ?? []).filter(
    (drop) => drop.kind !== "material" && drop.kind !== "core",
  );

  it("lead the rewards, modules, then the reactor, then the sets", () => {
    expect(shelter?.drops.slice(0, gear.length)).toEqual(gear);
    expect(gear.map((drop) => [drop.kind, drop.name])).toEqual([
      ["module", "Explosive Evade"],
      ["module", "Release Cutting Force"],
      ["module", "Turret Engineering"],
      ["module", "Water Play"],
      ["reactor", "Burning Phase Reactor"],
      ["component", "Annihilation Set"],
      ["component", "Enlightened Mage"],
    ]);
  });

  it("link each page, a set as all four pieces under the site's name", () => {
    expect(gear.at(4)?.href).toBe("/reactors?reactor=burning-phase-reactor");
    expect(gear.at(5)).toEqual({
      name: "Annihilation Set",
      imageUrl: `${imageHost}annihilation`,
      kind: "component",
      href: "/external-components?component=annihilation",
      ways: [],
      detail: "all 4 pieces",
    });
  });

  it("warn at build of a name NEXON's data lacks, and show it without a page", () => {
    expect(gear.at(6)?.href).toBeNull();
    expect(warnings).toContainEqual(
      expect.stringContaining('component "Enlightened Mage"'),
    );
  });
});

describe("operation400Places", () => {
  it("knows each 400% place's operation by its id, never the Hard one's", () => {
    expect(Object.fromEntries(operation400Places(acquisitions))).toEqual({
      "MS:DungeonField:620130100:Hard_400": "the-shelter",
      "MM:DungeonField:620130100:Hard_400": "the-shelter",
      "MS:DungeonField:620330100:Hard_400": "the-asylum",
      "MS:DungeonField:620530100:Hard_400": "heart-of-the-fortress",
    });
  });
});
