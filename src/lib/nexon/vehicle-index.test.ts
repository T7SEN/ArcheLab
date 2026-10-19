import { describe, expect, it } from "vitest";
import { imageHost } from "./metadata";
import { vehicleGroups, type VehicleRecord } from "./vehicle-index";

/** A vehicle shaped like NEXON's (read 2026-10-17), levels out of order. */
const vehicle = (id: string, name: string): VehicleRecord => ({
  vehicle_id: id,
  vehicle_name: name,
  vehicle_description: `Speed Hover Bike, ${name}`,
  vehicle_tier_id: "Tier2",
  image_url: `${imageHost}${id}`,
  stat_effect: [
    { stat_id: "105000237", stat_value: 50 },
    { stat_id: "999", stat_value: 1 },
  ],
  stat_effect_per_level: [
    {
      vehicle_level: 2,
      stat_effect: [{ stat_id: "105000230", stat_value: 2030 }],
    },
    {
      vehicle_level: 1,
      stat_effect: [{ stat_id: "105000230", stat_value: 2000 }],
    },
  ],
});

const stats = [
  { stat_id: "105000230", stat_name: "Max Speed" },
  {
    stat_id: "105000237",
    stat_name: "Turning Power during Boost",
  },
];

describe("vehicleGroups", () => {
  it("orders vehicles by id, levels by level, and names their stats", () => {
    const groups = vehicleGroups(
      [vehicle("107300003", "Orca"), vehicle("107300002", "Vortex")],
      stats,
      { research: [], materials: [] },
    );
    expect(groups.map((group) => group.slug)).toEqual(["vortex", "orca"]);
    const vortex = groups.at(0);
    expect(vortex?.description).toBe("Speed Hover Bike, Vortex");
    // A stat stat.json doesn't name is left out.
    expect(vortex?.stats).toEqual([
      { name: "Turning Power during Boost", value: 50 },
    ]);
    expect(vortex?.levels).toEqual([
      { level: 1, stats: [{ name: "Max Speed", value: 2000 }] },
      { level: 2, stats: [{ name: "Max Speed", value: 2030 }] },
    ]);
    expect(vortex?.research).toBeNull();
  });

  it("finds the vehicle's research", () => {
    const group = vehicleGroups([vehicle("107300002", "Vortex")], stats, {
      research: [
        {
          research_name: "Vortex",
          research_type: "Vehicle",
          research_time: 86400,
          research_cost: [{ currency_type: "Gold", currency_value: 600000 }],
          research_result: [{ meta_type: "vehicle_id", meta_id: "107300002" }],
          research_material: [],
        },
      ],
      materials: [],
    }).at(0);
    expect(group?.research).toMatchObject({
      time: 86400,
      costs: [{ currency: "Gold", value: 600000 }],
    });
  });
});
