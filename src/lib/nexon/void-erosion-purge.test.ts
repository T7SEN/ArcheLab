import { afterAll, describe, expect, it, vi } from "vitest";
import { purgeCycle } from "@/data/void-erosion-purge";
import { imageHost } from "./metadata";
import type { AcquisitionRecord, MaterialRecord } from "./shared-sets";
import { purgeMaps, purgePlaces, voidErosionPurge } from "./void-erosion-purge";

// Shaped like NEXON's acquisition-detail.json and consumable-material.json (read
// 2026-10-19): a Normal stage's places are its completion, with no word after the name,
// and its "Mission Monster"; a Challenge stage has its completion only.
const place = (id: string, name: string): AcquisitionRecord => ({
  acquisition_detail_id: id,
  acquisition_detail_name: name,
});

const acquisitions = [
  place(
    "MS:VoidErosion:10:Normal",
    "[ Void Erosion Purge ] [ Normal ] - [ Stage 10 ]",
  ),
  place(
    "MM:VoidErosion:10:Normal",
    "[ Void Erosion Purge ] [ Normal ] - [ Stage 10 ] Mission Monster",
  ),
  place(
    "MS:VoidErosion:2:Normal",
    "[ Void Erosion Purge ] [ Normal ] - [ Stage 2 ]",
  ),
  place(
    "MS:VoidErosion:1:Challenge",
    "[Void Erosion Purge] [Challenge] - [Stage 1]",
  ),
  // Another instanced place, not a stage of Void Erosion Purge.
  place("MS:ClashMode:622601101:1", "Complete [Onslaught][Stage 1]"),
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
    "MS:VoidErosion:10:Normal",
    "MS:VoidErosion:2:Normal",
    "MS:ClashMode:622601101:1",
  ]),
  material("265202008", "Defense Augmentation Core VIII", "CoreItem", [
    "MS:VoidErosion:10:Normal",
  ]),
  material("265202010", "Defense Augmentation Core X", "CoreItem", [
    "MM:VoidErosion:10:Normal",
    "MS:VoidErosion:1:Challenge",
  ]),
  material("263020001", "Trigger Module Loot D", "Consumable", [
    "MM:VoidErosion:10:Normal",
  ]),
];

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

describe("voidErosionPurge", () => {
  const { maps, stages } = voidErosionPurge({
    acquisitions,
    materials,
    research: [],
    itemHrefs: new Map([
      ["Defense Augmentation Core X", "/cores?core=defense"],
    ]),
    mapNames: new Set(purgeCycle),
  });
  const bySlug = (slug: string) => stages.find((stage) => stage.slug === slug);

  it("lists the stages found, Normal before Challenge, each from Stage 1", () => {
    expect(stages.map((stage) => stage.slug)).toEqual([
      "normal-2",
      "normal-10",
      "challenge-1",
    ]);
    expect(bySlug("normal-10")).toMatchObject({
      difficulty: "Normal",
      stage: 10,
    });
  });

  it("gives a stage its drops, each way they come, materials before cores", () => {
    expect(
      bySlug("normal-10")?.drops.map((drop) => [
        drop.name,
        drop.kind,
        drop.ways,
      ]),
    ).toEqual([
      ["Collectible Coin", "material", ["complete"]],
      ["Trigger Module Loot D", "material", ["Mission Monster"]],
      ["Defense Augmentation Core VIII", "core", ["complete"]],
      ["Defense Augmentation Core X", "core", ["Mission Monster"]],
    ]);
    expect(bySlug("challenge-1")?.drops.map((drop) => drop.name)).toEqual([
      "Defense Augmentation Core X",
    ]);
    expect(
      bySlug("challenge-1")?.drops.find(
        (drop) => drop.name === "Defense Augmentation Core X",
      )?.href,
    ).toBe("/cores?core=defense");
  });

  it("gives the five maps in the cycle's order, each with its picture", () => {
    expect(maps.map((map) => [map.position, map.name])).toEqual(
      purgeCycle.map((name, index) => [index + 1, name]),
    );
    expect(maps.at(0)).toMatchObject({
      slug: "eroded-ancestors-ruins",
      imageUrl: "/art/void-erosion-purge/eroded-ancestors-ruins.webp",
      width: 1400,
      height: 691,
    });
    expect(warnings).toEqual([]);
  });
});

describe("purgeMaps", () => {
  it("warns of a map the reward list doesn't name, and of none when it didn't load", () => {
    purgeMaps(new Set());
    expect(warn).not.toHaveBeenCalled();
    purgeMaps(new Set(purgeCycle.slice(1)));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('"Eroded Ancestors Ruins"'),
    );
  });
});

describe("purgePlaces", () => {
  it("maps each stage's places to its address, and nothing else", () => {
    expect([...purgePlaces(acquisitions)]).toEqual([
      ["MS:VoidErosion:10:Normal", "normal-10"],
      ["MM:VoidErosion:10:Normal", "normal-10"],
      ["MS:VoidErosion:2:Normal", "normal-2"],
      ["MS:VoidErosion:1:Challenge", "challenge-1"],
    ]);
  });
});
