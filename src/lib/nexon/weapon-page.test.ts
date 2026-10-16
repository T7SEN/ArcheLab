import { describe, expect, it } from "vitest";
import { groupStats } from "@/features/weapons/stat-groups";
import { imageHost } from "./metadata";
import {
  weaponPageFrom,
  weaponSlug,
  weaponSummaries,
  type WeaponSets,
} from "./weapon-page";

const img = (name: string) => `${imageHost}${name}`;

/** A small slice of NEXON's sets, shaped like the real ones (read 2026-10-16). */
const sets: WeaponSets = {
  weapons: [
    {
      weapon_id: "211064002",
      weapon_name: "Monster Hunter",
      image_url: img("monster-hunter"),
      weapon_type: "Assault Rifle",
      weapon_tier_id: "Tier4",
      weapon_rounds_type: "General Rounds",
      available_core_slot: [],
      base_stat: [
        { stat_id: "105000023", stat_value: 618 },
        // No name in stat.json, so it is left out.
        { stat_id: "105000999", stat_value: 1 },
        { stat_id: "105000030", stat_value: 25 },
      ],
      firearm_atk: [
        {
          level: 2,
          firearm: [
            { firearm_atk_type: "105000026", firearm_atk_value: 152 },
            { firearm_atk_type: "105000058", firearm_atk_value: 302 },
          ],
        },
        {
          level: 1,
          firearm: [
            { firearm_atk_type: "105000026", firearm_atk_value: 73 },
            { firearm_atk_type: "105000058", firearm_atk_value: 146 },
            // Only at level 1, so it is left out.
            { firearm_atk_type: "105000060", firearm_atk_value: 9 },
          ],
        },
      ],
      weapon_perk_ability_name: "Hunter's Sense",
      weapon_perk_ability_description: "Line one.\nLine two.",
      weapon_perk_ability_image_url: img("sense"),
    },
    {
      weapon_id: "211043001",
      weapon_name: "Thunder Cage",
      image_url: img("thunder-cage"),
      weapon_type: "Hand Cannon",
      weapon_tier_id: "Tier3",
      weapon_rounds_type: "Impact Rounds",
      available_core_slot: ["381000001"],
      base_stat: [],
      firearm_atk: [],
      weapon_perk_ability_name: "Overcharge",
      weapon_perk_ability_description: "Electric.",
      weapon_perk_ability_image_url: img("overcharge"),
    },
    {
      weapon_id: "211001001",
      weapon_name: "Emperor's Guard Lance",
      image_url: img("lance"),
      weapon_type: "Beam Rifle",
      weapon_tier_id: "Tier2",
      weapon_rounds_type: "Enhanced Ammo",
      available_core_slot: [],
      base_stat: [],
      firearm_atk: [],
      weapon_perk_ability_name: null,
      weapon_perk_ability_description: null,
      weapon_perk_ability_image_url: null,
    },
  ],
  stats: [
    { stat_id: "105000023", stat_name: "Fire Rate", stat_order_no: 1 },
    {
      stat_id: "105000030",
      stat_name: "Firearm Critical Hit Rate",
      stat_order_no: 2,
    },
    { stat_id: "105000026", stat_name: "Firearm ATK", stat_order_no: 3 },
    { stat_id: "105000058", stat_name: "Fire ATK", stat_order_no: 4 },
    { stat_id: "105000060", stat_name: "Electric ATK", stat_order_no: 5 },
  ],
  research: [
    {
      research_name: "Thunder Cage",
      research_type: "Equipment",
      research_cost: [{ currency_type: "Gold", currency_value: 100000 }],
      research_result: [{ meta_type: "weapon_id", meta_id: "211043001" }],
      research_material: [
        {
          meta_type: "consumable_material_id",
          meta_id: "261021101",
          material_count: 1,
        },
      ],
    },
  ],
  materials: [
    {
      consumable_material_id: "261021101",
      consumable_material_name: "Thunder Cage Polymer Syncytium",
      image_url: img("syncytium"),
      acquisition_detail: [],
    },
  ],
};

describe("weaponSlug", () => {
  it("lowercases names, drops apostrophes and joins words with hyphens", () => {
    expect(weaponSlug("Monster Hunter")).toBe("monster-hunter");
    expect(weaponSlug("Emperor's Guard Lance")).toBe("emperors-guard-lance");
    expect(weaponSlug("ATR-0 Prototype")).toBe("atr-0-prototype");
  });
});

describe("weaponPageFrom", () => {
  const page = weaponPageFrom(sets, "monster-hunter");

  it("finds the weapon by its slug, or nothing", () => {
    expect(page?.name).toBe("Monster Hunter");
    expect(weaponPageFrom(sets, "emperors-guard-lance")?.type).toBe(
      "Beam Rifle",
    );
    expect(weaponPageFrom(sets, "nothing")).toBeNull();
  });

  it("lists each ATK type at every level, lowest level first", () => {
    expect(page?.levels).toEqual([1, 2]);
    expect(page?.attack).toEqual([
      { name: "Firearm ATK", values: [73, 152], baseValues: null },
      { name: "Fire ATK", values: [146, 302], baseValues: null },
    ]);
  });

  it("names the base stats in NEXON's order and leaves out unnamed ones", () => {
    expect(page?.stats).toEqual([
      { name: "Fire Rate", value: 618 },
      { name: "Firearm Critical Hit Rate", value: 25 },
    ]);
  });

  it("gives the unique ability, or none for weapons without one", () => {
    expect(page?.ability).toEqual({
      name: "Hunter's Sense",
      description: "Line one.\nLine two.",
      imageUrl: img("sense"),
    });
    expect(weaponPageFrom(sets, "emperors-guard-lance")?.ability).toBeNull();
  });

  it("counts core slots and finds the Equipment research", () => {
    expect(page?.coreSlots).toBe(0);
    expect(page?.research).toBeNull();
    const ultimate = weaponPageFrom(sets, "thunder-cage");
    expect(ultimate?.coreSlots).toBe(1);
    expect(ultimate?.research?.costs).toEqual([
      { currency: "Gold", value: 100000 },
    ]);
    expect(ultimate?.research?.items.map((item) => item.name)).toEqual([
      "Thunder Cage Polymer Syncytium",
    ]);
  });
});

describe("weaponSummaries", () => {
  it("lists the highest tier first, then NEXON's id order", () => {
    expect(weaponSummaries(sets.weapons)).toEqual([
      {
        slug: "monster-hunter",
        name: "Monster Hunter",
        imageUrl: img("monster-hunter"),
        tier: "Tier4",
        type: "Assault Rifle",
        rounds: "General Rounds",
      },
      {
        slug: "thunder-cage",
        name: "Thunder Cage",
        imageUrl: img("thunder-cage"),
        tier: "Tier3",
        type: "Hand Cannon",
        rounds: "Impact Rounds",
      },
      {
        slug: "emperors-guard-lance",
        name: "Emperor's Guard Lance",
        imageUrl: img("lance"),
        tier: "Tier2",
        type: "Beam Rifle",
        rounds: "Enhanced Ammo",
      },
    ]);
  });

  it("orders weapons of one tier by id, whatever their order in the file", () => {
    const weapons = [
      { ...sets.weapons[1], weapon_id: "211043002", weapon_name: "B" },
      { ...sets.weapons[1], weapon_id: "211013001", weapon_name: "A" },
    ];
    expect(weaponSummaries(weapons).map((weapon) => weapon.name)).toEqual([
      "A",
      "B",
    ]);
  });

  it("links each page to its neighbors in that order, none past either end", () => {
    const link = (slug: string) => {
      const page = weaponPageFrom(sets, slug);
      return [page?.previous?.slug ?? null, page?.next?.slug ?? null];
    };
    expect(link("monster-hunter")).toEqual([null, "thunder-cage"]);
    expect(link("thunder-cage")).toEqual([
      "monster-hunter",
      "emperors-guard-lance",
    ]);
    expect(link("emperors-guard-lance")).toEqual(["thunder-cage", null]);
  });
});

describe("groupStats", () => {
  it("groups stats by what they do, in each group's order, leaving out empty groups", () => {
    const groups = groupStats([
      { name: "Sprint Speed", value: 800 },
      { name: "Firearm Critical Hit Damage", value: 1.8 },
      { name: "Fire Rate", value: 618 },
      { name: "Firearm Critical Hit Rate", value: 25 },
    ]);
    expect(
      groups.map((group) => [
        group.title,
        group.stats.map((stat) => stat.name),
      ]),
    ).toEqual([
      ["Damage", ["Firearm Critical Hit Rate", "Firearm Critical Hit Damage"]],
      ["Handling", ["Fire Rate"]],
      ["Movement", ["Sprint Speed"]],
    ]);
  });

  it("puts a stat it doesn't know under Other", () => {
    expect(groupStats([{ name: "Something New", value: 1 }])).toEqual([
      { title: "Other", stats: [{ name: "Something New", value: 1 }] },
    ]);
  });
});
