import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  defaultFilters,
  filterDescendants,
  filtersToSearch,
  parseFilters,
  type Filters,
  type IndexCard,
} from "./index-filters";
import { urlSearchOf } from "@/features/game-data/url-query";

const offered = {
  attributes: ["Fire", "Chill", "Electric", "Non-Attribute"],
  archeTypes: ["Fusion", "Singular", "Tech"],
};

/** Shaped like the index's cards; the mix of types is made up for the tests. */
const cards: IndexCard[] = [
  {
    slug: "raven",
    name: "Raven",
    ultimate: false,
    elements: ["Non-Attribute"],
    archeTypes: ["Fusion", "Singular"],
  },
  {
    slug: "ultimate-bunny",
    name: "Ultimate Bunny",
    ultimate: true,
    elements: ["Electric"],
    archeTypes: ["Singular"],
  },
  {
    slug: "bunny",
    name: "Bunny",
    ultimate: false,
    elements: ["Electric"],
    archeTypes: ["Singular"],
  },
  {
    slug: "ajax",
    name: "Ajax",
    ultimate: false,
    elements: ["Non-Attribute"],
    archeTypes: ["Tech"],
  },
];

/** Searches of only spaces, tabs and the like, which filter nothing. */
const blankArbitrary = fc.string({
  unit: fc.constantFrom(" ", "	", " ", "　"),
});

const slugs = (filters: Partial<Filters>) =>
  filterDescendants(cards, { ...defaultFilters, ...filters }).map(
    (card) => card.slug,
  );

describe("parseFilters", () => {
  it("reads every filter from the query", () => {
    expect(
      parseFilters(
        "?attribute=Electric&arche=Singular&kind=ultimate&q=bun&sort=az",
        offered,
      ),
    ).toEqual({
      attribute: "Electric",
      archeType: "Singular",
      kind: "ultimate",
      query: "bun",
      sort: "az",
    });
  });

  it("gives the defaults for an empty query", () => {
    expect(parseFilters("", offered)).toEqual(defaultFilters);
  });

  it("ignores values the index doesn't offer, so an old link still works", () => {
    expect(
      parseFilters(
        "?attribute=Water&arche=Void&kind=both&sort=random",
        offered,
      ),
    ).toEqual(defaultFilters);
  });
});

describe("filtersToSearch", () => {
  it("leaves the defaults out of the query", () => {
    expect(filtersToSearch(defaultFilters)).toBe("");
  });

  it("keeps a blank search, so the box keeps it, and the URL leaves it out", () => {
    const search = filtersToSearch({ ...defaultFilters, query: "   " });
    expect(parseFilters(search, offered).query).toBe("   ");
    expect(urlSearchOf(search)).toBe("");
    expect(
      urlSearchOf(
        filtersToSearch({ ...defaultFilters, kind: "base", query: " " }),
      ),
    ).toBe("?kind=base");
  });

  it("writes only what differs from the defaults", () => {
    expect(
      filtersToSearch({
        ...defaultFilters,
        attribute: "Non-Attribute",
        sort: "az",
      }),
    ).toBe("?attribute=Non-Attribute&sort=az");
  });

  const filters = fc.record({
    attribute: fc.option(fc.constantFrom(...offered.attributes)),
    archeType: fc.option(fc.constantFrom(...offered.archeTypes)),
    kind: fc.constantFrom("all", "base", "ultimate"),
    query: fc.oneof(fc.string(), blankArbitrary),
    sort: fc.constantFrom("newest", "az"),
  });

  it("round-trips through parseFilters for any offered filters", () => {
    fc.assert(
      fc.property(filters, (value) => {
        expect(parseFilters(filtersToSearch(value), offered)).toEqual(value);
      }),
    );
  });

  it("round-trips through the URL, where a blank search reads back as none", () => {
    fc.assert(
      fc.property(filters, (value) => {
        const query = value.query.trim() === "" ? "" : value.query;
        expect(
          parseFilters(urlSearchOf(filtersToSearch(value)), offered),
        ).toEqual({ ...value, query });
      }),
    );
  });
});

describe("filterDescendants", () => {
  it("shows every card in NEXON's order by default", () => {
    expect(slugs({})).toEqual(["raven", "ultimate-bunny", "bunny", "ajax"]);
  });

  it("filters by attribute, Arche type and Ultimate", () => {
    expect(slugs({ attribute: "Electric" })).toEqual([
      "ultimate-bunny",
      "bunny",
    ]);
    expect(slugs({ archeType: "Singular" })).toEqual([
      "raven",
      "ultimate-bunny",
      "bunny",
    ]);
    expect(slugs({ kind: "ultimate" })).toEqual(["ultimate-bunny"]);
    expect(slugs({ kind: "base" })).toEqual(["raven", "bunny", "ajax"]);
  });

  it("combines filters", () => {
    expect(
      slugs({ attribute: "Electric", archeType: "Singular", kind: "base" }),
    ).toEqual(["bunny"]);
    expect(slugs({ attribute: "Fire" })).toEqual([]);
  });

  it("matches every search word in the name, ignoring case and order", () => {
    expect(slugs({ query: "BUN" })).toEqual(["ultimate-bunny", "bunny"]);
    expect(slugs({ query: " bunny  ult " })).toEqual(["ultimate-bunny"]);
    expect(slugs({ query: "raven bunny" })).toEqual([]);
  });

  it("sorts A–Z without changing the cards it was given", () => {
    const before = cards.map((card) => card.slug);
    expect(slugs({ sort: "az" })).toEqual([
      "ajax",
      "bunny",
      "raven",
      "ultimate-bunny",
    ]);
    expect(cards.map((card) => card.slug)).toEqual(before);
  });
});
