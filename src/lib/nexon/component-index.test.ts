import { describe, expect, it } from "vitest";
import {
  componentGroups,
  componentSubStats,
  type ComponentRecord,
} from "./component-index";
import { imageHost } from "./metadata";

const img = (name: string) => `${imageHost}${name}`;

/** A component shaped like NEXON's (read 2026-10-16), with what each test changes. */
function componentOf(
  fields: Partial<ComponentRecord> &
    Pick<
      ComponentRecord,
      | "external_component_id"
      | "external_component_name"
      | "external_component_equipment_type"
    >,
): ComponentRecord {
  return {
    image_url: img(fields.external_component_id),
    external_component_tier_id: "Tier3",
    available_core_slot: ["381010001"],
    base_stat: [
      { level: 2, stat_id: "105000001", stat_value: 10 },
      { level: 1, stat_id: "105000001", stat_value: 9 },
    ],
    set_option_detail: [],
    ...fields,
  };
}

const volcano = [
  { set_option: "Active Volcano", set_count: 4, set_option_effect: "Four." },
  { set_option: "Active Volcano", set_count: 2, set_option_effect: "Two." },
];

const stats = [{ stat_id: "105000001", stat_name: "Max HP" }];

describe("componentGroups", () => {
  const groups = componentGroups(
    [
      componentOf({
        external_component_id: "4",
        external_component_name: "Volcanic Processor",
        external_component_equipment_type: "Processor",
        set_option_detail: volcano,
      }),
      componentOf({
        external_component_id: "1",
        external_component_name: "Volcanic Auxiliary Power",
        external_component_equipment_type: "Auxiliary Power",
        set_option_detail: volcano,
      }),
      componentOf({
        external_component_id: "11",
        external_component_name: "HP Support Sensor",
        external_component_equipment_type: "Sensor",
        external_component_tier_id: "Tier1",
        available_core_slot: [],
      }),
      componentOf({
        external_component_id: "13",
        external_component_name: "HP Support Sensor",
        external_component_equipment_type: "Sensor",
      }),
      componentOf({
        external_component_id: "12",
        external_component_name: "HP Support Auxiliary Power",
        external_component_equipment_type: "Auxiliary Power",
        external_component_tier_id: "Tier1",
        available_core_slot: [],
      }),
    ],
    stats,
  );

  it("makes one card per set, and one per name for components with no set", () => {
    expect(groups.map((group) => [group.slug, group.name, group.kind])).toEqual(
      [
        ["active-volcano", "Active Volcano", "set"],
        ["hp-support", "HP Support", "standalone"],
      ],
    );
  });

  it("orders pieces by tier, highest first, then by slot", () => {
    expect(
      groups.at(0)?.pieces.map((piece) => [piece.slot, piece.tier]),
    ).toEqual([
      ["Auxiliary Power", "Tier3"],
      ["Processor", "Tier3"],
    ]);
    expect(groups.at(1)?.pieces.map((piece) => piece.id)).toEqual([
      "13",
      "12",
      "11",
    ]);
  });

  it("turns a literal backslash-n in a set effect into a line break", () => {
    const shell = componentGroups(
      [
        componentOf({
          external_component_id: "21",
          external_component_name: "Shell Crusher Sensor",
          external_component_equipment_type: "Sensor",
          set_option_detail: [
            {
              set_option: "Shell Crusher",
              set_count: 4,
              set_option_effect: "One.\\nTwo.",
            },
          ],
        }),
      ],
      stats,
    ).at(0);
    expect(shell?.bonuses).toEqual([{ count: 4, effect: "One.\nTwo." }]);
  });

  it("lists a set's bonuses by count, and none without a set", () => {
    expect(groups.at(0)?.bonuses).toEqual([
      { count: 2, effect: "Two." },
      { count: 4, effect: "Four." },
    ]);
    expect(groups.at(1)?.bonuses).toEqual([]);
  });

  it("names a piece's base stat, lists its levels lowest first, and counts two core slots for each one listed", () => {
    const piece = groups.at(0)?.pieces.at(0);
    expect(piece?.stat).toBe("Max HP");
    expect(piece?.levels).toEqual([
      { level: 1, value: 9 },
      { level: 2, value: 10 },
    ]);
    expect(piece?.coreSlots).toBe(2);
    expect(groups.at(1)?.pieces.at(-1)?.coreSlots).toBe(0);
  });
});

describe("componentSubStats", () => {
  it("names each slot's sub-stats from stat.json, leaving out any it doesn't name", () => {
    const named = componentSubStats([
      { stat_id: "105000024", stat_name: "Max MP" },
      { stat_id: "105000063", stat_name: "Chill Resistance" },
    ]);
    expect(named.Sensor).toEqual(["Max MP", "Chill Resistance"]);
    expect(named.Processor).toEqual([]);
    expect(Object.keys(named)).toEqual([
      "Auxiliary Power",
      "Sensor",
      "Memory",
      "Processor",
    ]);
  });
});
