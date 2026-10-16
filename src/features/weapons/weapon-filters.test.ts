import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  defaultWeaponFilters,
  filterWeapons,
  parseWeaponFilters,
  weaponFiltersToSearch,
  type WeaponCard,
  type WeaponFilters,
} from "./weapon-filters";
import { urlSearchOf } from "@/features/game-data/url-query";

const offered = {
  tiers: ["Transcendent", "Ultimate", "Rare", "Normal"],
  types: ["Assault Rifle", "Hand Cannon", "Beam Rifle"],
  rounds: ["General Rounds", "Impact Rounds", "Enhanced Ammo"],
};

/** Shaped like the index's cards, in its order; the mix is made up for the tests. */
const cards: WeaponCard[] = [
  {
    slug: "monster-hunter",
    name: "Monster Hunter",
    tier: "Transcendent",
    type: "Assault Rifle",
    rounds: "General Rounds",
  },
  {
    slug: "thunder-cage",
    name: "Thunder Cage",
    tier: "Ultimate",
    type: "Hand Cannon",
    rounds: "Impact Rounds",
  },
  {
    slug: "enduring-legacy",
    name: "Enduring Legacy",
    tier: "Ultimate",
    type: "Assault Rifle",
    rounds: "General Rounds",
  },
  {
    slug: "dogma-21",
    name: "Dogma 21",
    tier: "Rare",
    type: "Beam Rifle",
    rounds: "Enhanced Ammo",
  },
];

/** Searches of only spaces, tabs and the like, which filter nothing. */
const blankArbitrary = fc.string({
  unit: fc.constantFrom(" ", "	", " ", "　"),
});

const slugs = (filters: Partial<WeaponFilters>) =>
  filterWeapons(cards, { ...defaultWeaponFilters, ...filters }).map(
    (card) => card.slug,
  );

describe("parseWeaponFilters", () => {
  it("reads every filter from the query", () => {
    expect(
      parseWeaponFilters(
        "?tier=Ultimate&type=Hand+Cannon&rounds=Impact+Rounds&q=cage&sort=az",
        offered,
      ),
    ).toEqual({
      tier: "Ultimate",
      type: "Hand Cannon",
      rounds: "Impact Rounds",
      query: "cage",
      sort: "az",
    });
  });

  it("gives the defaults for an empty query", () => {
    expect(parseWeaponFilters("", offered)).toEqual(defaultWeaponFilters);
  });

  it("ignores values the index doesn't offer, so an old link still works", () => {
    expect(
      parseWeaponFilters(
        "?tier=Mythic&type=Bow&rounds=Arrows&sort=random",
        offered,
      ),
    ).toEqual(defaultWeaponFilters);
  });
});

describe("weaponFiltersToSearch", () => {
  it("leaves the defaults out of the query", () => {
    expect(weaponFiltersToSearch(defaultWeaponFilters)).toBe("");
  });

  it("keeps a blank search, so the box keeps it, and the URL leaves it out", () => {
    const search = weaponFiltersToSearch({
      ...defaultWeaponFilters,
      query: "  ",
    });
    expect(parseWeaponFilters(search, offered).query).toBe("  ");
    expect(urlSearchOf(search)).toBe("");
    expect(
      urlSearchOf(
        weaponFiltersToSearch({
          ...defaultWeaponFilters,
          tier: "Rare",
          query: " ",
        }),
      ),
    ).toBe("?tier=Rare");
  });

  it("writes only what differs from the defaults", () => {
    expect(
      weaponFiltersToSearch({
        ...defaultWeaponFilters,
        rounds: "General Rounds",
        sort: "az",
      }),
    ).toBe("?rounds=General+Rounds&sort=az");
  });

  const filters = fc.record({
    tier: fc.option(fc.constantFrom(...offered.tiers)),
    type: fc.option(fc.constantFrom(...offered.types)),
    rounds: fc.option(fc.constantFrom(...offered.rounds)),
    query: fc.oneof(fc.string(), blankArbitrary),
    sort: fc.constantFrom("tier", "az"),
  });

  it("round-trips through parseWeaponFilters for any offered filters", () => {
    fc.assert(
      fc.property(filters, (value) => {
        expect(
          parseWeaponFilters(weaponFiltersToSearch(value), offered),
        ).toEqual(value);
      }),
    );
  });

  it("round-trips through the URL, where a blank search reads back as none", () => {
    fc.assert(
      fc.property(filters, (value) => {
        const query = value.query.trim() === "" ? "" : value.query;
        expect(
          parseWeaponFilters(
            urlSearchOf(weaponFiltersToSearch(value)),
            offered,
          ),
        ).toEqual({ ...value, query });
      }),
    );
  });
});

describe("filterWeapons", () => {
  it("shows every card in the index's order by default", () => {
    expect(slugs({})).toEqual([
      "monster-hunter",
      "thunder-cage",
      "enduring-legacy",
      "dogma-21",
    ]);
  });

  it("filters by tier, type and rounds, alone and together", () => {
    expect(slugs({ tier: "Ultimate" })).toEqual([
      "thunder-cage",
      "enduring-legacy",
    ]);
    expect(slugs({ type: "Assault Rifle" })).toEqual([
      "monster-hunter",
      "enduring-legacy",
    ]);
    expect(slugs({ rounds: "Enhanced Ammo" })).toEqual(["dogma-21"]);
    expect(
      slugs({
        tier: "Ultimate",
        type: "Assault Rifle",
        rounds: "General Rounds",
      }),
    ).toEqual(["enduring-legacy"]);
    expect(slugs({ tier: "Normal" })).toEqual([]);
  });

  it("matches every search word in the name, ignoring case and order", () => {
    expect(slugs({ query: "CAGE" })).toEqual(["thunder-cage"]);
    expect(slugs({ query: " legacy  enduring " })).toEqual(["enduring-legacy"]);
    expect(slugs({ query: "monster cage" })).toEqual([]);
    // A phone keyboard's curly apostrophe matches a straight one.
    expect(
      filterWeapons(
        [{ ...cards[0], slug: "lance", name: "Emperor's Guard Lance" }],
        { ...defaultWeaponFilters, query: "emperor’s" },
      ).map((card) => card.slug),
    ).toEqual(["lance"]);
  });

  it("sorts A–Z without changing the cards it was given", () => {
    const before = cards.map((card) => card.slug);
    expect(slugs({ sort: "az" })).toEqual([
      "dogma-21",
      "enduring-legacy",
      "monster-hunter",
      "thunder-cage",
    ]);
    expect(cards.map((card) => card.slug)).toEqual(before);
  });
});
