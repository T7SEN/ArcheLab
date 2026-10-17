import { describe, expect, it } from "vitest";
import {
  formatVehicleStat,
  groupVehicleStats,
  openVehicle,
  vehicleKeyStats,
  vehicleKind,
  vehicleSearch,
  type VehicleCard,
} from "./vehicle-card";

describe("the open vehicle in the URL", () => {
  const slugs = ["glide-4", "vortex", "orca"];

  it("opens a vehicle the page has, and nothing else", () => {
    expect(openVehicle("?vehicle=orca", slugs)).toBe("orca");
    expect(openVehicle("?vehicle=bunny", slugs)).toBeNull();
    expect(openVehicle("", slugs)).toBeNull();
  });

  it("writes the query back", () => {
    expect(vehicleSearch("glide-4")).toBe("?vehicle=glide-4");
    expect(vehicleSearch(null)).toBe("");
  });
});

describe("a vehicle card's key numbers", () => {
  it("are four, at its top level, in the card's order", () => {
    const card: VehicleCard = {
      slug: "vortex",
      name: "Vortex",
      description: "Speed Hover Bike, Vortex",
      tierName: "Rare",
      hex: "#d487f5",
      imageUrl: "https://open.api.nexon.com/static/tfd/img/x",
      stats: [
        { name: "Turning Power", value: 80 },
        { name: "Boost Cost", value: 100 },
      ],
      levels: [
        { level: 1, stats: [{ name: "Max Speed", value: 2000 }] },
        {
          level: 20,
          stats: [
            { name: "Boost Gauge Capacity", value: 1000 },
            { name: "Max Speed on Boost", value: 3000 },
            { name: "Max Speed", value: 2500 },
          ],
        },
      ],
      research: null,
    };
    expect(vehicleKeyStats(card)).toEqual([
      { name: "Max Speed", value: "2,500" },
      { name: "Max Speed on Boost", value: "3,000" },
      { name: "Turning Power", value: "80" },
      { name: "Boost Gauge Capacity", value: "1,000" },
    ]);
  });
});

describe("a vehicle's kind", () => {
  it("is NEXON's line without the name", () => {
    expect(
      vehicleKind({ name: "Vortex", description: "Speed Hover Bike, Vortex" }),
    ).toBe("Speed Hover Bike");
  });

  it("keeps a line that doesn't end with the name whole", () => {
    expect(vehicleKind({ name: "Orca", description: "Hover Bike" })).toBe(
      "Hover Bike",
    );
  });
});

describe("vehicle stats", () => {
  it("go in their groups, in each group's order, and the unknown under Other", () => {
    expect(
      groupVehicleStats([
        { name: "Boost Cost", value: 100 },
        { name: "Turning Power", value: 80 },
        { name: "Max Speed", value: 2500 },
        { name: "Acceleration on Boost", value: 3600 },
        { name: "Hover Height", value: 3 },
      ]).map((group) => [group.title, group.stats.map((stat) => stat.name)]),
    ).toEqual([
      ["Speed", ["Max Speed", "Acceleration on Boost"]],
      ["Turning", ["Turning Power"]],
      ["Boost", ["Boost Cost"]],
      ["Other", ["Hover Height"]],
    ]);
  });

  it("show Modifiers as percentages and the rest as NEXON gives them", () => {
    expect(
      formatVehicleStat({
        name: "Reverse Movement Speed Modifier",
        value: 0.25,
      }),
    ).toBe("25%");
    expect(formatVehicleStat({ name: "Max Speed", value: 2500 })).toBe("2,500");
    expect(
      formatVehicleStat({ name: "Boost Gauge Recovery Interval", value: 0.1 }),
    ).toBe("0.1");
  });
});
