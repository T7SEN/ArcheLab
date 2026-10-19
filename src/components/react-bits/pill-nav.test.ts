import { describe, expect, it } from "vitest";
import { menuColumns, sectionsOf, type PillNavLink } from "./pill-nav";

const link = (label: string, section?: string): PillNavLink => ({
  label,
  href: `/${label}`,
  section,
});

// Shaped like the Database menu (T7SEN, 2026-10-19): the group's own page, then its
// sections of 8, 6, 1 and 2 pages.
const database = [
  link("database"),
  ...["a", "b", "c", "d", "e", "f", "g", "h"].map((n) => link(n, "Equipment")),
  ...["i", "j", "k", "l", "m", "n"].map((n) => link(n, "Consumable")),
  link("o", "Collection"),
  ...["p", "q"].map((n) => link(n, "Game info")),
];
const sections = sectionsOf(database.slice(1));
const labels = (columns: ReturnType<typeof menuColumns>) =>
  columns.map((column) => column.map((section) => section.label));

describe("sectionsOf", () => {
  it("keeps a group's links in order, under their sections", () => {
    expect(
      sectionsOf(database).map((section) => [
        section.label,
        section.links.length,
      ]),
    ).toEqual([
      [undefined, 1],
      ["Equipment", 8],
      ["Consumable", 6],
      ["Collection", 1],
      ["Game info", 2],
    ]);
  });

  it("starts a new section whenever the section changes", () => {
    expect(
      sectionsOf([link("a", "X"), link("b", "Y"), link("c", "X")]).map(
        (section) => section.label,
      ),
    ).toEqual(["X", "Y", "X"]);
    expect(sectionsOf([])).toEqual([]);
  });
});

describe("menuColumns", () => {
  it("gives each section a column when they all fit", () => {
    expect(labels(menuColumns(sections, Infinity))).toEqual([
      ["Equipment"],
      ["Consumable"],
      ["Collection"],
      ["Game info"],
    ]);
    expect(labels(menuColumns(sections, 4))).toHaveLength(4);
  });

  it("puts short sections together when fewer columns fit, keeping the longest short", () => {
    expect(labels(menuColumns(sections, 3))).toEqual([
      ["Equipment"],
      ["Consumable"],
      ["Collection", "Game info"],
    ]);
    expect(labels(menuColumns(sections, 2))).toEqual([
      ["Equipment"],
      ["Consumable", "Collection", "Game info"],
    ]);
    expect(labels(menuColumns(sections, 1))).toEqual([
      ["Equipment", "Consumable", "Collection", "Game info"],
    ]);
  });

  it("always lays out every section once, in order", () => {
    for (const fit of [0, 1, 2, 3, 4, 5, Infinity]) {
      expect(labels(menuColumns(sections, fit)).flat()).toEqual([
        "Equipment",
        "Consumable",
        "Collection",
        "Game info",
      ]);
    }
    expect(menuColumns([], 3)).toEqual([]);
  });
});
