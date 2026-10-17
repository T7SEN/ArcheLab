import { describe, expect, it } from "vitest";
import { mutantCellNotes } from "@/data/mutant-cells";
import {
  defaultMutantCellFilters,
  filterMutantCells,
  mutantCellCards,
  mutantCellFiltersToSearch,
  parseMutantCellFilters,
} from "./mutant-cell-filters";

// The notes' cells stand in for NEXON's, which have the same names, sockets and
// numbers (ADR 0040), each with a made-up icon.
const icon = (name: string) =>
  `https://open.api.nexon.com/static/tfd/img/${name.length.toString(16).padStart(32, "0")}`;
const cards = mutantCellCards(
  mutantCellNotes.map((cell) => ({ ...cell, imageUrl: icon(cell.name) })),
);
const slugs = cards.map((card) => card.slug);
const names = (search: string) =>
  filterMutantCells(cards, parseMutantCellFilters(search, slugs)).map(
    (card) => card.name,
  );

describe("the Mutant Cells index's cards", () => {
  it("run by socket, then A–Z", () => {
    expect(cards.at(0)).toMatchObject({
      name: "Activate Thrust",
      slug: "activate-thrust",
    });
    // Each keeps its icon.
    expect(cards.at(0)?.imageUrl).toBe(icon("Activate Thrust"));
    expect(cards.at(-1)?.name).toBe("Venomous Spike");
    const sockets = cards.map((card) => card.socket);
    expect(sockets.indexOf("Cerulean")).toBe(12);
    expect(sockets.lastIndexOf("Almandine")).toBe(11);
  });
});

describe("the Mutant Cells index's filters in the URL", () => {
  it("reads a socket, a search and the open cell", () => {
    expect(
      parseMutantCellFilters("?socket=Rutile&q=wound&cell=recover-mp", slugs),
    ).toEqual({ socket: "Rutile", query: "wound", open: "recover-mp" });
  });

  it("ignores a socket or cell the index doesn't have", () => {
    expect(parseMutantCellFilters("?socket=Ruby&cell=bunny", slugs)).toEqual(
      defaultMutantCellFilters,
    );
  });

  it("writes only what isn't a default", () => {
    expect(mutantCellFiltersToSearch(defaultMutantCellFilters)).toBe("");
    expect(
      mutantCellFiltersToSearch({
        socket: "Xantic",
        query: "poison",
        open: "venomous-spike",
      }),
    ).toBe("?socket=Xantic&q=poison&cell=venomous-spike");
  });
});

describe("filtering Mutant Cells", () => {
  it("keeps a socket's cells", () => {
    expect(names("?socket=Cerulean")).toHaveLength(10);
  });

  it("finds a word in the name, trigger or effects", () => {
    // Triggers: Clash type skills.
    expect(names("?q=clash")).toEqual(["Activate Thrust", "Venomous Spike"]);
    // Effects: what a cell raises.
    expect(names("?q=weak%20point")).toEqual(["Chill Focus Aiming"]);
    // Every word must be found, in any of them.
    expect(names("?socket=Malachite&q=piercing")).toEqual([
      "Maximize Piercing Wound",
    ]);
  });

  it("ignores case, extra spaces and curly apostrophes", () => {
    expect(names("?q=%20%20STEADY%20")).toEqual(["Steady Hands"]);
  });
});
