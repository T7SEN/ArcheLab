import { describe, expect, it } from "vitest";
import {
  readDatabaseItems,
  searchDatabase,
  type DatabaseItem,
} from "./database-items";

const item = (
  name: string,
  category: DatabaseItem["category"],
  keywords: string[] = [],
  hint = "",
): DatabaseItem => ({
  name,
  category,
  href: `/x/${name}`,
  hint,
  keywords,
  imageUrl: "https://example.test/a.png",
  hex: "#ffffff",
});

const items = [
  item("Ultimate Bunny", "Descendants", [], "Ultimate"),
  item("Bunny", "Descendants"),
  item(
    "Thunder Cage",
    "Weapons",
    ["Submachine Gun"],
    "Ultimate · Submachine Gun",
  ),
  item("Storm Cage", "Weapons", ["Submachine Gun"], "Transcendent"),
  item("Nightfall", "Modules", ["Descendant", "Skill"], "Transcendent"),
  item("Burning Phase Reactor", "Reactors", ["Fire", "Dimension"]),
  item("Active Volcano", "External Components", ["Volcanic Sensor"]),
];

const names = (search: string) =>
  searchDatabase(items, search).map((entry) => entry.name);

describe("database search", () => {
  it("needs two characters", () => {
    expect(names("")).toEqual([]);
    expect(names("b")).toEqual([]);
    expect(names(" b ")).toEqual([]);
  });

  it("puts the exact name first, then names starting with it", () => {
    expect(names("bunny")).toEqual(["Bunny", "Ultimate Bunny"]);
  });

  it("finds items by a word of their name, keywords or category", () => {
    expect(names("cage")).toEqual(["Storm Cage", "Thunder Cage"]);
    expect(names("submachine")).toEqual(["Storm Cage", "Thunder Cage"]);
    expect(names("volcanic sensor")).toEqual(["Active Volcano"]);
    expect(names("reactor fire")).toEqual(["Burning Phase Reactor"]);
  });

  it("needs every word somewhere", () => {
    expect(names("cage fire")).toEqual([]);
    expect(names("zzzz")).toEqual([]);
  });

  it("orders equal matches by category, then A–Z", () => {
    expect(names("transcendent")).toEqual(["Storm Cage", "Nightfall"]);
  });
});

describe("reading the items file", () => {
  it("takes a well-formed list", () => {
    expect(readDatabaseItems({ items })).toHaveLength(items.length);
  });

  it("rejects anything else", () => {
    expect(readDatabaseItems(null)).toBeNull();
    expect(readDatabaseItems({ items: [{ name: "x" }] })).toBeNull();
    expect(
      readDatabaseItems({ items: [{ ...items[0], category: "Fellows" }] }),
    ).toBeNull();
  });
});
