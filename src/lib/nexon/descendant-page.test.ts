import { describe, expect, it } from "vitest";
import { elementIconUrls } from "@/features/descendants/element-icons";
import { rarityOf } from "@/features/game-data/rarity";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import {
  descendantPageFrom,
  descendantSlug,
  descendantSummaries,
  type DescendantSets,
} from "./descendant-page";
import { imageHost } from "./metadata";

const img = (name: string) => `${imageHost}${name}`;

const bunnySkill = {
  skill_type: "Active Skill",
  skill_name: "Lightning Emission",
  element_type: "Electric",
  arche_type: "Singular",
  skill_image_url: img("emission"),
  skill_description: "Shared by the pair.",
};

/**
 * A small slice of NEXON's sets, shaped like the real ones (read 2026-10-16). Bunny's
 * pair is cut down to what pairing needs; its numbers are made up for the tests.
 */
const sets: DescendantSets = {
  descendants: [
    {
      descendant_id: "101000035",
      descendant_name: "Raven",
      descendant_group_id: "101000035",
      descendant_image_url: img("raven"),
      descendant_stat: [
        {
          level: 2,
          stat_detail: [
            { stat_id: "105000029", stat_value: 180 },
            { stat_id: "105000001", stat_value: 230 },
            { stat_id: "105000999", stat_value: 1 },
          ],
        },
        {
          level: 1,
          stat_detail: [
            { stat_id: "105000001", stat_value: 195 },
            { stat_id: "105000029", stat_value: 140 },
            { stat_id: "105000999", stat_value: 1 },
            // Only at level 1, so it is left out.
            { stat_id: "105000024", stat_value: 0 },
          ],
        },
      ],
      descendant_skill: [
        {
          skill_type: "Active Skill",
          skill_name: "Shadow Shot",
          element_type: "Non-Attribute",
          arche_type: "Fusion",
          skill_image_url: img("shot"),
          skill_description: "Line one.\n\nLine two.",
        },
        {
          skill_type: "Passive Skill",
          skill_name: "Queen of Darkness",
          element_type: "Non-Attribute",
          arche_type: null,
          skill_image_url: img("queen"),
          skill_description: "Passive.",
        },
      ],
    },
    {
      descendant_id: "101000001",
      descendant_name: "Bunny",
      descendant_group_id: "101000001",
      descendant_image_url: img("bunny"),
      descendant_stat: [
        {
          level: 1,
          stat_detail: [
            { stat_id: "105000001", stat_value: 100 },
            { stat_id: "105000029", stat_value: 50 },
          ],
        },
        {
          level: 2,
          stat_detail: [
            { stat_id: "105000001", stat_value: 120 },
            { stat_id: "105000029", stat_value: 60 },
          ],
        },
      ],
      descendant_skill: [bunnySkill],
    },
    {
      descendant_id: "101000004",
      descendant_name: "Ultimate Bunny",
      descendant_group_id: "101000001",
      descendant_image_url: img("ultimate-bunny"),
      descendant_stat: [
        {
          level: 1,
          stat_detail: [
            { stat_id: "105000001", stat_value: 110 },
            { stat_id: "105000029", stat_value: 50 },
          ],
        },
        {
          level: 2,
          stat_detail: [
            { stat_id: "105000001", stat_value: 140 },
            { stat_id: "105000029", stat_value: 70 },
          ],
        },
      ],
      descendant_skill: [bunnySkill],
    },
  ],
  stats: [
    { stat_id: "105000029", stat_name: "DEF", stat_order_no: 500 },
    { stat_id: "105000001", stat_name: "Max HP", stat_order_no: 300 },
    { stat_id: "105000024", stat_name: "Max MP", stat_order_no: 400 },
  ],
  modules: [
    {
      module_id: "1",
      module_name: "Nightfall",
      image_url: img("nightfall"),
      module_type: null,
      module_tier_id: "Tier4",
      module_socket_type: "Rutile",
      available_descendant_id: ["101000035"],
      available_module_slot_type: ["Skill"],
      module_stat: [
        {
          level: 10,
          module_capacity: 7,
          value: "Changes Shadow Shot to an Attack Skill.",
        },
        { level: 0, module_capacity: 17, value: "At zero." },
      ],
    },
    {
      module_id: "3",
      module_name: "Shadow's Resolve",
      image_url: img("resolve"),
      module_type: "Ancestors",
      module_tier_id: "Tier4",
      module_socket_type: null,
      available_descendant_id: ["101000035"],
      available_module_slot_type: ["Main"],
      module_stat: [{ level: 0, module_capacity: 16, value: null }],
    },
    {
      module_id: "2",
      module_name: "Bunny's",
      image_url: img("other"),
      module_type: null,
      module_tier_id: "Tier4",
      module_socket_type: null,
      available_descendant_id: ["101000001", "101000004"],
      available_module_slot_type: ["Skill"],
      module_stat: [{ level: 0, module_capacity: 10, value: null }],
    },
    {
      module_id: "4",
      module_name: "Ultimate Bunny's own",
      image_url: img("own"),
      module_type: null,
      module_tier_id: "Tier4",
      module_socket_type: null,
      available_descendant_id: ["101000004"],
      available_module_slot_type: ["Skill"],
      module_stat: [{ level: 0, module_capacity: 10, value: null }],
    },
  ],
  research: [
    {
      research_name: "Raven",
      research_type: "Character",
      research_cost: [{ currency_type: "Gold", currency_value: 400000 }],
      research_result: [{ meta_type: "descendant_id", meta_id: "101000035" }],
      research_material: [
        {
          meta_type: "consumable_material_id",
          meta_id: "261021315",
          material_count: 1,
        },
        {
          meta_type: "consumable_material_id",
          meta_id: "261021321",
          material_count: 1,
        },
      ],
    },
    {
      research_name: "Raven Enhanced Cells",
      research_type: "CharacterMaterial",
      research_cost: [{ currency_type: "Gold", currency_value: 200000 }],
      research_result: [
        { meta_type: "consumable_material_id", meta_id: "261021315" },
      ],
      research_material: [
        {
          meta_type: "consumable_material_id",
          meta_id: "261511007",
          material_count: 554,
        },
      ],
    },
  ],
  materials: [
    {
      consumable_material_id: "261021315",
      consumable_material_name: "Raven Enhanced Cells",
      image_url: img("cells"),
      acquisition_detail: [],
    },
    {
      consumable_material_id: "261021321",
      consumable_material_name: "Raven Code",
      image_url: img("code"),
      acquisition_detail: ["AM:262051183", "QS:630100791"],
    },
    {
      consumable_material_id: "261511007",
      consumable_material_name: "Carbon Crystal",
      image_url: img("carbon"),
      acquisition_detail: ["FO:Common:610000007:Normal"],
    },
    {
      consumable_material_id: "262051183",
      consumable_material_name: "Amorphous Material Pattern: Raven",
      image_url: img("pattern"),
      acquisition_detail: [],
    },
  ],
};

describe("descendantSlug", () => {
  it("lowercases names and joins words with hyphens", () => {
    expect(descendantSlug("Raven")).toBe("raven");
    expect(descendantSlug("Ultimate Bunny")).toBe("ultimate-bunny");
  });
});

describe("descendantPageFrom", () => {
  const page = descendantPageFrom(sets, "raven");

  it("finds the Descendant by its slug, or nothing", () => {
    expect(page?.name).toBe("Raven");
    expect(descendantPageFrom(sets, "ultimate-bunny")?.name).toBe(
      "Ultimate Bunny",
    );
    expect(descendantPageFrom(sets, "nobody")).toBeNull();
  });

  it("lists stats in the Descendant's own order with a value at every level", () => {
    expect(page?.levels).toEqual([1, 2]);
    expect(page?.stats).toEqual([
      { name: "Max HP", values: [195, 230], baseValues: null },
      { name: "DEF", values: [140, 180], baseValues: null },
    ]);
  });

  it("keeps the skills in order and lists their attributes once", () => {
    expect(page?.skills.map((skill) => skill.name)).toEqual([
      "Shadow Shot",
      "Queen of Darkness",
    ]);
    expect(page?.skills[0]?.description).toBe("Line one.\n\nLine two.");
    expect(page?.elements).toEqual(["Non-Attribute"]);
    // Singular is T7SEN's in-game finding (arche-types.ts); her skills say Fusion.
    expect(page?.archeTypes).toEqual(["Fusion", "Singular"]);
    expect(page?.skills.map((skill) => skill.archeType)).toEqual([
      "Fusion",
      null,
    ]);
  });

  it("keeps only the modules this Descendant can equip, lowest to highest level", () => {
    expect(page?.modules).toEqual([
      {
        name: "Nightfall",
        imageUrl: img("nightfall"),
        tier: "Tier4",
        type: null,
        socket: "Rutile",
        slots: ["Skill"],
        capacity: {
          from: { level: 0, value: 17 },
          to: { level: 10, value: 7 },
        },
        effect: "Changes Shadow Shot to an Attack Skill.",
        transcendent: true,
        changesSkills: ["Shadow Shot"],
        ultimateOnly: false,
      },
      {
        name: "Shadow's Resolve",
        imageUrl: img("resolve"),
        tier: "Tier4",
        type: "Ancestors",
        socket: null,
        slots: ["Main"],
        capacity: {
          from: { level: 0, value: 16 },
          to: { level: 0, value: 16 },
        },
        effect: null,
        // Tier4 but an Ancestor module, so not one of the Transcendent switch's.
        transcendent: false,
        changesSkills: [],
        ultimateOnly: false,
      },
    ]);
  });

  it("follows the research recipe one level down and names Amorphous sources", () => {
    expect(page?.research?.costs).toEqual([
      { currency: "Gold", value: 400000 },
    ]);
    const items = page?.research?.items ?? [];
    const cells = items.at(0);
    const code = items.at(1);
    expect(cells?.name).toBe("Raven Enhanced Cells");
    expect(cells?.recipe?.costs).toEqual([{ currency: "Gold", value: 200000 }]);
    expect(cells?.recipe?.items.map((item) => [item.name, item.count])).toEqual(
      [["Carbon Crystal", 554]],
    );
    expect(code?.recipe).toBeNull();
    expect(code?.from).toEqual([
      { name: "Amorphous Material Pattern: Raven", imageUrl: img("pattern") },
    ]);
  });
});

describe("Ultimate pairs", () => {
  const base = descendantPageFrom(sets, "bunny");
  const ultimate = descendantPageFrom(sets, "ultimate-bunny");
  const pair = [
    { slug: "bunny", name: "Bunny", ultimate: false },
    { slug: "ultimate-bunny", name: "Ultimate Bunny", ultimate: true },
  ];

  it("pairs a base and its Ultimate by group, base first, on both pages", () => {
    expect(base?.pair).toEqual(pair);
    expect(ultimate?.pair).toEqual(pair);
    expect(ultimate?.ultimate).toBe(true);
    expect(base?.ultimate).toBe(false);
  });

  it("gives a Descendant without an Ultimate no pair", () => {
    expect(descendantPageFrom(sets, "raven")?.pair).toBeNull();
  });

  it("compares only an Ultimate's stats with its base at each level", () => {
    expect(ultimate?.baseName).toBe("Bunny");
    expect(ultimate?.stats).toEqual([
      { name: "Max HP", values: [110, 140], baseValues: [100, 120] },
      { name: "DEF", values: [50, 70], baseValues: [50, 60] },
    ]);
    expect(base?.baseName).toBeNull();
    expect(base?.stats.every((stat) => stat.baseValues === null)).toBe(true);
  });

  it("marks the modules the Ultimate's base can't equip", () => {
    expect(
      ultimate?.modules.map((module) => [module.name, module.ultimateOnly]),
    ).toEqual([
      ["Bunny's", false],
      ["Ultimate Bunny's own", true],
    ]);
    expect(base?.modules.map((module) => module.name)).toEqual(["Bunny's"]);
    expect(base?.modules.every((module) => !module.ultimateOnly)).toBe(true);
  });
});

describe("descendantSummaries", () => {
  it("lists every Descendant newest first, with its attributes and Arche types", () => {
    expect(descendantSummaries(sets.descendants)).toEqual([
      {
        slug: "raven",
        name: "Raven",
        ultimate: false,
        imageUrl: img("raven"),
        elements: ["Non-Attribute"],
        archeTypes: ["Fusion", "Singular"],
      },
      {
        slug: "ultimate-bunny",
        name: "Ultimate Bunny",
        ultimate: true,
        imageUrl: img("ultimate-bunny"),
        elements: ["Electric"],
        archeTypes: ["Singular"],
      },
      {
        slug: "bunny",
        name: "Bunny",
        ultimate: false,
        imageUrl: img("bunny"),
        elements: ["Electric"],
        archeTypes: ["Singular"],
      },
    ]);
  });

  it("links each page to its neighbors in that order, none past either end", () => {
    const link = (slug: string) => {
      const page = descendantPageFrom(sets, slug);
      return [page?.previous?.slug ?? null, page?.next?.slug ?? null];
    };
    expect(link("raven")).toEqual([null, "ultimate-bunny"]);
    expect(link("ultimate-bunny")).toEqual(["raven", "bunny"]);
    expect(link("bunny")).toEqual(["ultimate-bunny", null]);
  });
});

describe("rarityOf", () => {
  it("names tiers and colors them from the chat registry", () => {
    expect(rarityOf("Tier4")).toEqual({
      name: "Transcendent",
      hex: chatRegistry.tagsByName.get("tier4")?.hex,
    });
    expect(rarityOf("Tier3")?.name).toBe("Ultimate");
    expect(rarityOf("Tier9")).toBeNull();
  });
});

describe("elementIconUrls", () => {
  it("gives each attribute NEXON's Library icon, and nothing for an unknown one", () => {
    const urls = elementIconUrls(["Non-Attribute", "Fire", "Unknown"]);
    expect(Object.keys(urls)).toEqual(["Non-Attribute", "Fire"]);
    expect(urls["Non-Attribute"]).toMatch(/icon_elemental--Plain\.png$/);
    expect(urls.Fire).toMatch(/icon_elemental--Blazer\.png$/);
  });
});
