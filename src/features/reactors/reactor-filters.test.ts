import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { urlSearchOf } from "@/features/game-data/url-query";
import {
  defaultReactorFilters,
  filterReactors,
  parseReactorFilters,
  reactorFiltersToSearch,
  type ReactorCard,
  type ReactorFilters,
  type ReactorOptions,
} from "./reactor-filters";

const cardOf = (
  slug: string,
  name: string,
  attribute: string,
  archeType: string,
): ReactorCard => ({
  slug,
  name,
  attribute,
  archeType,
  boosts: [],
  tiers: [],
  descendants: [],
});

/** Real names and pairings (reactor.json, read 2026-10-16), out of order. */
const cards = [
  cardOf("toxic-phase-reactor", "Toxic Phase Reactor", "Toxic", "Dimension"),
  cardOf("burning-phase-reactor", "Burning Phase Reactor", "Fire", "Dimension"),
  cardOf(
    "burning-mechanics-reactor",
    "Burning Mechanics Reactor",
    "Fire",
    "Tech",
  ),
];

const offered: ReactorOptions = {
  attributes: ["Fire", "Toxic"],
  archeTypes: ["Dimension", "Tech"],
  reactors: cards.map((card) => card.slug),
};

const slugs = (filters: Partial<ReactorFilters>) =>
  filterReactors(cards, { ...defaultReactorFilters, ...filters }).map(
    (card) => card.slug,
  );

/** Searches of only spaces, tabs and the like, which filter nothing. */
const blankArbitrary = fc.string({
  unit: fc.constantFrom(" ", "	", " ", "　"),
});

describe("parseReactorFilters", () => {
  it("reads every filter and the open reactor from the query", () => {
    expect(
      parseReactorFilters(
        "?attribute=Fire&type=Tech&q=burn&reactor=burning-mechanics-reactor",
        offered,
      ),
    ).toEqual({
      attribute: "Fire",
      archeType: "Tech",
      query: "burn",
      open: "burning-mechanics-reactor",
    });
  });

  it("ignores values the index doesn't offer, so an old link still works", () => {
    expect(
      parseReactorFilters("?attribute=Wind&type=Magic&reactor=gone", offered),
    ).toEqual(defaultReactorFilters);
  });
});

describe("reactorFiltersToSearch", () => {
  it("leaves the defaults out of the query", () => {
    expect(reactorFiltersToSearch(defaultReactorFilters)).toBe("");
  });

  const filters = fc.record({
    attribute: fc.option(fc.constantFrom(...offered.attributes)),
    archeType: fc.option(fc.constantFrom(...offered.archeTypes)),
    query: fc.oneof(fc.string(), blankArbitrary),
    open: fc.option(fc.constantFrom(...offered.reactors)),
  });

  it("round-trips through parseReactorFilters for any offered filters", () => {
    fc.assert(
      fc.property(filters, (value) => {
        expect(
          parseReactorFilters(reactorFiltersToSearch(value), offered),
        ).toEqual(value);
      }),
    );
  });

  it("round-trips through the URL, where a blank search reads back as none", () => {
    fc.assert(
      fc.property(filters, (value) => {
        const query = value.query.trim() === "" ? "" : value.query;
        expect(
          parseReactorFilters(
            urlSearchOf(reactorFiltersToSearch(value)),
            offered,
          ),
        ).toEqual({ ...value, query });
      }),
    );
  });
});

describe("filterReactors", () => {
  it("shows every reactor A–Z by default", () => {
    expect(slugs({})).toEqual([
      "burning-mechanics-reactor",
      "burning-phase-reactor",
      "toxic-phase-reactor",
    ]);
  });

  it("filters by attribute and Arche type, alone and together", () => {
    expect(slugs({ attribute: "Fire" })).toEqual([
      "burning-mechanics-reactor",
      "burning-phase-reactor",
    ]);
    expect(slugs({ archeType: "Dimension" })).toEqual([
      "burning-phase-reactor",
      "toxic-phase-reactor",
    ]);
    expect(slugs({ attribute: "Toxic", archeType: "Tech" })).toEqual([]);
  });

  it("matches search words in the name, attribute or Arche type", () => {
    expect(slugs({ query: "fire" })).toEqual([
      "burning-mechanics-reactor",
      "burning-phase-reactor",
    ]);
    expect(slugs({ query: "PHASE dimension" })).toEqual([
      "burning-phase-reactor",
      "toxic-phase-reactor",
    ]);
    expect(slugs({ query: "toxic tech" })).toEqual([]);
  });
});
