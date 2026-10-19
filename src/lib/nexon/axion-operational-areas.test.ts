import { afterAll, describe, expect, it, vi } from "vitest";
import { axionOperationalAreas, axionPlaces } from "./axion-operational-areas";
import { imageHost } from "./metadata";
import type { AcquisitionRecord, MaterialRecord } from "./shared-sets";

// Shaped like NEXON's acquisition-detail.json and consumable-material.json (read
// 2026-10-19): an Operational Area mission's places are its "complete" and its
// "Mission Monster".
const place = (id: string, name: string): AcquisitionRecord => ({
  acquisition_detail_id: id,
  acquisition_detail_name: name,
});

const acquisitions = [
  place(
    "MS:BaseMission:621500102:Hard",
    "[ Axion Plains ] [ Hard ] - [ First Crater ] complete",
  ),
  place(
    "MM:BaseMission:621500102:Hard",
    "[ Axion Plains ] [ Hard ] - [ First Crater ] Mission Monster",
  ),
  place(
    "MS:BaseMission:621500103:Hard",
    "[Axion Plains] [Hard] - [AX Refinery] complete",
  ),
  // Another Axion place, not one of the seven missions.
  place(
    "MS:VoidExium:621500109:Hard",
    "[ Axion Plains ] [ Hard ] - [ Axium Drop Zone A ] complete",
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
    "MS:BaseMission:621500102:Hard",
    "MS:BaseMission:621500103:Hard",
  ]),
  material(
    "264000001",
    "Amorphous Material Pattern: ERASER",
    "AmorphousMaterial",
    ["MS:BaseMission:621500102:Hard"],
  ),
  material("265202010", "Defense Augmentation Core X", "CoreItem", [
    "MM:BaseMission:621500102:Hard",
  ]),
  material("261511013", "Archive Shard", "ResearchMaterial", [
    "MS:BaseMission:621500102:Hard",
    "MM:BaseMission:621500102:Hard",
    "MS:VoidExium:621500109:Hard",
  ]),
];

// The cycle names missions this test has no places for: each warns, as at build.
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

describe("axionOperationalAreas", () => {
  const missions = axionOperationalAreas({
    acquisitions,
    materials,
    research: [],
    itemHrefs: new Map([
      ["Defense Augmentation Core X", "/cores?core=defense"],
      [
        "Amorphous Material Pattern: ERASER",
        "/amorphous-materials?pattern=eraser",
      ],
    ]),
  });
  const byName = (name: string) =>
    missions.find((mission) => mission.name === name);

  it("lists the missions that have places, in the cycle's order, and warns of the rest", () => {
    expect(missions.map((mission) => mission.slug)).toEqual([
      "ax-refinery",
      "first-crater",
    ]);
    expect(warnings).toContainEqual(
      expect.stringContaining('"Liquefied AX Vault"'),
    );
  });

  it("gives a mission its drops, each way they come, materials before cores", () => {
    expect(
      byName("First Crater")?.drops.map((drop) => [
        drop.name,
        drop.kind,
        drop.ways,
      ]),
    ).toEqual([
      ["Amorphous Material Pattern: ERASER", "material", ["complete"]],
      ["Archive Shard", "material", ["complete", "Mission Monster"]],
      ["Collectible Coin", "material", ["complete"]],
      ["Defense Augmentation Core X", "core", ["Mission Monster"]],
    ]);
    expect(byName("AX Refinery")?.drops.map((drop) => drop.name)).toEqual([
      "Collectible Coin",
    ]);
  });

  it("names the pattern its completion gives, with its page", () => {
    expect(byName("First Crater")?.pattern).toEqual({
      name: "Amorphous Material Pattern: ERASER",
      imageUrl: `${imageHost}264000001`,
      href: "/amorphous-materials?pattern=eraser",
    });
    expect(byName("AX Refinery")?.pattern).toBeNull();
  });

  it("takes its Transcendent weapon chance from Update 1.4.0's table", () => {
    expect(byName("First Crater")?.transcendent).toEqual({
      chance: "3.78%",
      min: 201,
      max: 350,
    });
  });
});

describe("axionPlaces", () => {
  it("maps each mission's places to its address, and nothing else in Axion Plains", () => {
    expect([...axionPlaces(acquisitions)]).toEqual([
      ["MS:BaseMission:621500102:Hard", "first-crater"],
      ["MM:BaseMission:621500102:Hard", "first-crater"],
      ["MS:BaseMission:621500103:Hard", "ax-refinery"],
    ]);
  });
});
