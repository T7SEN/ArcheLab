import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { urlSearchOf } from "@/features/game-data/url-query";
import {
  componentFiltersToSearch,
  defaultComponentFilters,
  filterComponents,
  parseComponentFilters,
  type ComponentCard,
  type ComponentFilters,
  type ComponentOptions,
  type ComponentPieceCard,
} from "./component-filters";

const tiers = ["Ultimate", "Rare", "Normal"];

const piece = (
  name: string,
  tier: string,
  slot = "Sensor",
): ComponentPieceCard => ({
  id: name,
  name,
  slot,
  tier,
  hex: "#ffffff",
  imageUrl: "https://open.api.nexon.com/static/tfd/img/x",
  stat: "Max HP",
  coreSlots: tier === "Ultimate" ? 2 : 0,
});

/** Real names and bonuses (external-component.json, read 2026-10-16), out of order. */
const cards: ComponentCard[] = [
  {
    slug: "tomb-vanguard",
    name: "Tomb Vanguard",
    kind: "set",
    bonuses: [{ count: 2, effect: "DEF 25%[x]" }],
    pieces: [piece("Tomb Vanguard Sensor", "Rare")],
  },
  {
    slug: "hp-support",
    name: "HP Support",
    kind: "standalone",
    bonuses: [],
    pieces: [
      piece("HP Support Sensor", "Ultimate"),
      piece("HP Support Sensor", "Rare"),
      piece("HP Support Sensor", "Normal"),
    ],
  },
  {
    slug: "active-volcano",
    name: "Active Volcano",
    kind: "set",
    bonuses: [{ count: 2, effect: "Fire Skill Power Boost Ratio 6.2%[+]" }],
    pieces: [piece("Volcanic Sensor", "Ultimate")],
  },
];

const offered: ComponentOptions = {
  tiers,
  cards: cards.map((card) => card.slug),
};

const slugs = (filters: Partial<ComponentFilters>) =>
  filterComponents(
    cards,
    { ...defaultComponentFilters, ...filters },
    tiers,
  ).map((card) => card.slug);

/** Searches of only spaces, tabs and the like, which filter nothing. */
const blankArbitrary = fc.string({
  unit: fc.constantFrom(" ", "	", " ", "　"),
});

describe("parseComponentFilters", () => {
  it("reads every filter and the open card from the query", () => {
    expect(
      parseComponentFilters(
        "?tier=Rare&q=tomb&component=tomb-vanguard",
        offered,
      ),
    ).toEqual({ tier: "Rare", query: "tomb", open: "tomb-vanguard" });
  });

  it("ignores values the index doesn't offer, so an old link still works", () => {
    expect(
      parseComponentFilters("?tier=Mythic&component=gone", offered),
    ).toEqual(defaultComponentFilters);
  });
});

describe("componentFiltersToSearch", () => {
  const filters = fc.record({
    tier: fc.option(fc.constantFrom(...offered.tiers)),
    query: fc.oneof(fc.string(), blankArbitrary),
    open: fc.option(fc.constantFrom(...offered.cards)),
  });

  it("round-trips through parseComponentFilters for any offered filters", () => {
    fc.assert(
      fc.property(filters, (value) => {
        expect(
          parseComponentFilters(componentFiltersToSearch(value), offered),
        ).toEqual(value);
      }),
    );
  });

  it("round-trips through the URL, where a blank search reads back as none", () => {
    fc.assert(
      fc.property(filters, (value) => {
        const query = value.query.trim() === "" ? "" : value.query;
        expect(
          parseComponentFilters(
            urlSearchOf(componentFiltersToSearch(value)),
            offered,
          ),
        ).toEqual({ ...value, query });
      }),
    );
  });
});

describe("filterComponents", () => {
  it("shows every card by highest tier, then A–Z", () => {
    expect(slugs({})).toEqual([
      "active-volcano",
      "hp-support",
      "tomb-vanguard",
    ]);
  });

  it("filters by a tier any of a card's pieces has", () => {
    expect(slugs({ tier: "Rare" })).toEqual(["hp-support", "tomb-vanguard"]);
    expect(slugs({ tier: "Normal" })).toEqual(["hp-support"]);
  });

  it("searches names, pieces' names and bonuses", () => {
    expect(slugs({ query: "volcanic sensor" })).toEqual(["active-volcano"]);
    expect(slugs({ query: "FIRE" })).toEqual(["active-volcano"]);
    expect(slugs({ query: "def 25%" })).toEqual(["tomb-vanguard"]);
    expect(slugs({ query: "fire tomb" })).toEqual([]);
  });
});
