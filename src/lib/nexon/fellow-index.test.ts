import { describe, expect, it } from "vitest";
import { fellowGroups, type FellowRecord } from "./fellow-index";
import { imageHost } from "./metadata";

/** A Fellow shaped like NEXON's (read 2026-10-17), levels out of order. */
const fellow = (id: string, name: string): FellowRecord => ({
  fellow_id: id,
  fellow_name: name,
  fellow_tier_id: "Tier1",
  fellow_detail: [
    {
      fellow_level: 2,
      stat_effect: [
        { stat_id: "105000176", stat_value: 0.02 },
        { stat_id: "999", stat_value: 1 },
      ],
    },
    {
      fellow_level: 1,
      stat_effect: [{ stat_id: "105000176", stat_value: 0.01 }],
    },
    { fellow_level: 3, stat_effect: null },
  ],
});

const stats = [
  {
    stat_id: "105000176",
    stat_name: "Module Drop Rate Increase Modifier",
  },
];

const material = (id: string, name: string) => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: [],
});

describe("fellowGroups", () => {
  it("orders Fellows by id, levels by level, and names their stats", () => {
    const groups = fellowGroups(
      [
        fellow("107200003", "Snowy Sled Dog"),
        fellow("107200001", "Hagios Sheepdog"),
      ],
      stats,
      { research: [], materials: [] },
    );
    expect(groups.map((group) => group.slug)).toEqual([
      "hagios-sheepdog",
      "snowy-sled-dog",
    ]);
    expect(groups.at(0)?.levels).toEqual([
      {
        level: 1,
        stats: [{ name: "Module Drop Rate Increase Modifier", value: 0.01 }],
      },
      // A stat stat.json doesn't name is left out.
      {
        level: 2,
        stats: [{ name: "Module Drop Rate Increase Modifier", value: 0.02 }],
      },
      { level: 3, stats: [] },
    ]);
    expect(groups.at(0)?.research).toBeNull();
  });

  it("finds the Fellow's research and its parts", () => {
    const group = fellowGroups(
      [fellow("107200001", "Hagios Sheepdog")],
      stats,
      {
        research: [
          {
            research_name: "Hagios Sheepdog",
            research_type: "Fellow",
            research_time: 7200,
            research_cost: [{ currency_type: "Gold", currency_value: 400000 }],
            research_result: [{ meta_type: "fellow_id", meta_id: "107200001" }],
            research_material: [
              {
                meta_type: "consumable_material_id",
                meta_id: "261021201",
                material_count: 1,
              },
            ],
          },
        ],
        materials: [material("261021201", "Hagios Sheepdog Code")],
      },
    ).at(0);
    expect(group?.research).toMatchObject({
      time: 7200,
      costs: [{ currency: "Gold", value: 400000 }],
      items: [{ name: "Hagios Sheepdog Code", count: 1 }],
    });
  });
});
