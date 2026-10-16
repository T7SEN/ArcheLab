import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { urlSearchOf } from "@/features/game-data/url-query";
import {
  defaultModuleFilters,
  filterModules,
  matchingVariants,
  moduleFiltersToSearch,
  parseModuleFilters,
  shownType,
  type ModuleCard,
  type ModuleFilters,
  type ModuleOptions,
  type ModuleVariantCard,
} from "./module-filters";

const tiers = ["Transcendent", "Ultimate", "Rare", "Normal"];

/** A version shaped like the index's; each test changes what it checks. */
function variantOf(fields: Partial<ModuleVariantCard>): ModuleVariantCard {
  return {
    id: "1",
    label: "General Rounds",
    category: "General Rounds",
    rounds: "General Rounds",
    weaponTypes: [],
    tier: "Rare",
    socket: "Rutile",
    type: "Multi-Hit Chance",
    slots: [],
    owners: [],
    imageUrl: "https://open.api.nexon.com/static/tfd/img/x",
    capacity: { from: 6, to: 16 },
    ...fields,
  };
}

/** Made-up mixes of real facts, in A–Z order like the index's input. */
const cards: ModuleCard[] = [
  {
    slug: "heat-incinerator",
    name: "Heat Incinerator",
    variants: [
      variantOf({ tier: "Ultimate", socket: "Almandine", type: null }),
      variantOf({
        id: "2",
        label: "Melee Weapon · Impact Rounds",
        category: "Melee Weapon",
        rounds: "Impact Rounds",
        tier: "Ultimate",
        socket: "Malachite",
        type: null,
      }),
    ],
  },
  {
    slug: "hunters-resolution",
    name: "Hunter's Resolution",
    variants: [
      variantOf({
        label: "Descendant",
        category: "Descendant",
        rounds: null,
        tier: "Transcendent",
        socket: null,
        type: "Ancestors",
        slots: ["Main"],
      }),
    ],
  },
  {
    slug: "multi-trigger-rifling",
    name: "Multi-Trigger Rifling",
    variants: [
      variantOf({}),
      variantOf({
        id: "3",
        label: "High-Power Rounds · Sniper Rifle",
        category: "High-Power Rounds",
        rounds: "High-Power Rounds",
        weaponTypes: ["Sniper Rifle"],
      }),
    ],
  },
  {
    slug: "nightfall",
    name: "Nightfall",
    variants: [
      variantOf({
        label: "Descendant",
        category: "Descendant",
        rounds: null,
        tier: "Transcendent",
        socket: "Rutile",
        type: null,
        slots: ["Skill"],
        owners: [{ slug: "raven", name: "Raven" }],
      }),
    ],
  },
];

const offered: ModuleOptions = {
  tiers,
  sockets: ["Almandine", "Malachite", "Rutile"],
  categories: [
    "Descendant",
    "General Rounds",
    "High-Power Rounds",
    "Melee Weapon",
  ],
  types: ["Ancestors", "Multi-Hit Chance"],
  slots: ["Main", "Skill"],
  owners: ["raven"],
  modules: cards.map((card) => card.slug),
};

/** Searches of only spaces, tabs and the like, which filter nothing. */
const blankArbitrary = fc.string({
  unit: fc.constantFrom(" ", "	", " ", "　"),
});

const slugs = (filters: Partial<ModuleFilters>) =>
  filterModules(cards, { ...defaultModuleFilters, ...filters }, tiers).map(
    (card) => card.slug,
  );

describe("parseModuleFilters", () => {
  it("reads every filter and the open module from the query", () => {
    expect(
      parseModuleFilters(
        "?tier=Rare&socket=Rutile&class=High-Power+Rounds&type=Multi-Hit+Chance&slot=Skill&owner=raven&q=rifling&sort=az&module=nightfall",
        offered,
      ),
    ).toEqual({
      tier: "Rare",
      socket: "Rutile",
      category: "High-Power Rounds",
      type: "Multi-Hit Chance",
      slot: "Skill",
      owner: "raven",
      query: "rifling",
      sort: "az",
      open: "nightfall",
    });
  });

  it("ignores values the index doesn't offer, so an old link still works", () => {
    expect(
      parseModuleFilters(
        "?tier=Mythic&socket=Ruby&class=Arrows&type=Luck&slot=Head&owner=nobody&sort=random&module=gone",
        offered,
      ),
    ).toEqual(defaultModuleFilters);
  });
});

describe("moduleFiltersToSearch", () => {
  it("leaves the defaults out of the query", () => {
    expect(moduleFiltersToSearch(defaultModuleFilters)).toBe("");
  });

  it("writes only what differs from the defaults", () => {
    expect(
      moduleFiltersToSearch({
        ...defaultModuleFilters,
        category: "Melee Weapon",
        open: "heat-incinerator",
      }),
    ).toBe("?class=Melee+Weapon&module=heat-incinerator");
  });

  const filters = fc.record({
    tier: fc.option(fc.constantFrom(...offered.tiers)),
    socket: fc.option(fc.constantFrom(...offered.sockets)),
    category: fc.option(fc.constantFrom(...offered.categories)),
    type: fc.option(fc.constantFrom(...offered.types)),
    slot: fc.option(fc.constantFrom(...offered.slots)),
    owner: fc.option(fc.constantFrom(...offered.owners)),
    query: fc.oneof(fc.string(), blankArbitrary),
    sort: fc.constantFrom("tier", "az"),
    open: fc.option(fc.constantFrom(...offered.modules)),
  });

  it("round-trips through parseModuleFilters for any offered filters", () => {
    fc.assert(
      fc.property(filters, (value) => {
        expect(
          parseModuleFilters(moduleFiltersToSearch(value), offered),
        ).toEqual(value);
      }),
    );
  });

  it("round-trips through the URL, where a blank search reads back as none", () => {
    fc.assert(
      fc.property(filters, (value) => {
        const query = value.query.trim() === "" ? "" : value.query;
        expect(
          parseModuleFilters(
            urlSearchOf(moduleFiltersToSearch(value)),
            offered,
          ),
        ).toEqual({ ...value, query });
      }),
    );
  });
});

describe("filterModules", () => {
  it("shows every card by highest tier, then A–Z, by default", () => {
    expect(slugs({})).toEqual([
      "hunters-resolution",
      "nightfall",
      "heat-incinerator",
      "multi-trigger-rifling",
    ]);
  });

  it("sorts A–Z on request", () => {
    expect(slugs({ sort: "az" })).toEqual(cards.map((card) => card.slug));
  });

  it("shows a card when any one version passes every filter", () => {
    expect(slugs({ category: "Melee Weapon" })).toEqual(["heat-incinerator"]);
    expect(slugs({ category: "High-Power Rounds", socket: "Rutile" })).toEqual([
      "multi-trigger-rifling",
    ]);
    // No single version is both melee and Almandine.
    expect(slugs({ category: "Melee Weapon", socket: "Almandine" })).toEqual(
      [],
    );
  });

  it("filters by slot, type and the Descendant who can equip it", () => {
    expect(slugs({ slot: "Main" })).toEqual(["hunters-resolution"]);
    expect(slugs({ type: "Ancestors" })).toEqual(["hunters-resolution"]);
    expect(slugs({ owner: "raven" })).toEqual(["nightfall"]);
  });

  it("matches every search word in the name, with curly apostrophes", () => {
    expect(slugs({ query: "HUNTER’S" })).toEqual(["hunters-resolution"]);
    expect(slugs({ query: "trigger multi" })).toEqual([
      "multi-trigger-rifling",
    ]);
    expect(slugs({ query: "heat rifling" })).toEqual([]);
  });
});

describe("matchingVariants", () => {
  it("keeps the versions that pass, for the details to open on", () => {
    const rifling = cards[2]?.variants ?? [];
    expect(
      matchingVariants(rifling, {
        ...defaultModuleFilters,
        category: "High-Power Rounds",
      }).map((variant) => variant.id),
    ).toEqual(["3"]);
    expect(matchingVariants(rifling, defaultModuleFilters)).toHaveLength(2);
  });
});

describe("shownType", () => {
  it("leaves out a type that repeats the tier, as Ancestors and Trigger do", () => {
    expect(
      shownType(variantOf({ tier: "Ancestors", type: "Ancestors" })),
    ).toBeNull();
    expect(shownType(variantOf({}))).toBe("Multi-Hit Chance");
  });
});
