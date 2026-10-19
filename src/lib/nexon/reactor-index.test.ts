import { describe, expect, it } from "vitest";
import type { DescendantSkillTypes } from "./descendant-page";
import { imageHost } from "./metadata";
import {
  reactorGroups,
  reactorMatch,
  type ReactorRecord,
} from "./reactor-index";

const img = (name: string) => `${imageHost}${name}`;

/** A reactor shaped like NEXON's (read 2026-10-16), with what each test changes. */
function reactorOf(
  fields: Partial<ReactorRecord> &
    Pick<ReactorRecord, "reactor_id" | "reactor_tier_id">,
): ReactorRecord {
  return {
    reactor_name: "Burning Phase Reactor",
    image_url: img(fields.reactor_id),
    reactor_skill_power: [
      {
        level: 2,
        skill_atk_power: 38.29,
        sub_skill_atk_power: 85,
        enchant_effect: [
          { enchant_level: 2, stat_id: "105000145", value: 2.297 },
          { enchant_level: 1, stat_id: "105000145", value: 1.149 },
        ],
        skill_power_coefficient: [
          { coefficient_stat_id: "105000148", coefficient_stat_value: 0.2 },
          { coefficient_stat_id: "105000154", coefficient_stat_value: 0.2 },
        ],
      },
      {
        level: 1,
        skill_atk_power: 21.538,
        sub_skill_atk_power: 40,
        enchant_effect: [],
        skill_power_coefficient: [
          { coefficient_stat_id: "105000148", coefficient_stat_value: 0.2 },
          { coefficient_stat_id: "105000154", coefficient_stat_value: 0.2 },
        ],
      },
    ],
    ...fields,
  };
}

const stats = [
  { stat_id: "105000145", stat_name: "Skill Power" },
  {
    stat_id: "105000148",
    stat_name: "Fire Skill Power Boost Ratio",
  },
  {
    stat_id: "105000154",
    stat_name: "Dimension Skill Power Boost Ratio",
  },
];

const descendant = (
  slug: string,
  skills: DescendantSkillTypes["skills"],
  extraArcheTypes: readonly string[] = [],
): DescendantSkillTypes => ({
  slug,
  name: slug,
  ultimate: false,
  imageUrl: img(slug),
  skills,
  extraArcheTypes,
});

const descendants = [
  descendant("blair", [
    { element: "Fire", archeType: "Dimension" },
    { element: "Fire", archeType: null },
  ]),
  // Fire and Dimension, but never in one skill.
  descendant("ajax", [
    { element: "Fire", archeType: "Tech" },
    { element: "Non-Attribute", archeType: "Dimension" },
  ]),
];

describe("reactorGroups", () => {
  const groups = reactorGroups(
    [
      reactorOf({ reactor_id: "245001102", reactor_tier_id: "Tier1" }),
      reactorOf({ reactor_id: "245002082", reactor_tier_id: "Tier3" }),
      reactorOf({ reactor_id: "245002062", reactor_tier_id: "Tier2" }),
    ],
    stats,
    descendants,
  );
  const phase = groups.at(0);

  it("groups a reactor's tiers under its name, highest tier first", () => {
    expect(groups).toHaveLength(1);
    expect(phase?.slug).toBe("burning-phase-reactor");
    expect(phase?.versions.map((version) => version.tier)).toEqual([
      "Tier3",
      "Tier2",
      "Tier1",
    ]);
  });

  it("names its boosts, and the attribute and Arche type they boost", () => {
    expect(phase?.boosts).toEqual([
      { name: "Fire Skill Power Boost Ratio", value: 0.2 },
      { name: "Dimension Skill Power Boost Ratio", value: 0.2 },
    ]);
    expect(phase?.attribute).toBe("Fire");
    expect(phase?.archeType).toBe("Dimension");
  });

  it("lists levels and enchants lowest first, with the stat's name", () => {
    const levels = phase?.versions.at(0)?.levels ?? [];
    expect(levels.map((level) => level.level)).toEqual([1, 2]);
    expect(levels.at(1)).toEqual({
      level: 2,
      skillPower: 38.29,
      subAttackPower: 85,
      enchants: [
        { level: 1, stat: "Skill Power", value: 1.149 },
        { level: 2, stat: "Skill Power", value: 2.297 },
      ],
    });
  });

  it("lists the Descendants with a skill of both its attribute and Arche type", () => {
    expect(phase?.descendants.map((entry) => entry.slug)).toEqual(["blair"]);
  });
});

describe("reactorMatch", () => {
  // Raven's five skills are all Non-Attribute Fusion in NEXON's data (2026-10-16), and
  // she is Singular too (T7SEN, arche-types.ts).
  const raven = descendant(
    "raven",
    [
      { element: "Non-Attribute", archeType: "Fusion" },
      { element: "Non-Attribute", archeType: "Fusion" },
    ],
    ["Singular"],
  );

  it("matches a skill of both the attribute and the Arche type", () => {
    expect(reactorMatch(raven, "Non-Attribute", "Fusion")).toBe(true);
  });

  it("counts a found Arche type when every skill has the attribute", () => {
    expect(reactorMatch(raven, "Non-Attribute", "Singular")).toBe(true);
    expect(reactorMatch(raven, "Fire", "Singular")).toBe(false);
  });

  it("doesn't count it when the skills' attributes differ: which skills it applies to is unknown", () => {
    const mixed = descendant(
      "mixed",
      [
        { element: "Fire", archeType: "Tech" },
        { element: "Non-Attribute", archeType: "Tech" },
      ],
      ["Singular"],
    );
    expect(reactorMatch(mixed, "Fire", "Singular")).toBe(false);
    expect(reactorMatch(mixed, "Non-Attribute", "Singular")).toBe(false);
  });
});
