import { describe, expect, it } from "vitest";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import {
  coreMaterialFiltersToSearch,
  defaultCoreMaterialFilters,
  filterCoreMaterials,
  forText,
  parseCoreMaterialFilters,
  type CoreMaterial,
} from "./core-material-filters";

const tiers: CosmeticTier[] = [
  { id: "Tier3", name: "Ultimate", hex: "#F7DB78" },
  { id: "Tier2", name: "Rare", hex: "#D487F5" },
];

const item = (
  slug: string,
  name: string,
  tier: string,
  more: Partial<CoreMaterial> = {},
): CoreMaterial => ({
  slug,
  name,
  tier,
  imageUrl: "",
  uses: [],
  recipe: null,
  patterns: [],
  sources: [],
  ...more,
});

const items = [
  item("ultimate-bunny-code", "Ultimate Bunny Code", "Tier3", {
    uses: [
      { kind: "descendant", slug: "ultimate-bunny", name: "Ultimate Bunny" },
    ],
    patterns: [{ slug: "041", name: "041", rate: 38 }],
  }),
  item("thunder-cage-blueprint", "Thunder Cage Blueprint", "Tier2", {
    uses: [{ kind: "weapon", slug: "thunder-cage", name: "Thunder Cage" }],
    sources: ["[Kingston] [Hard] - [Magister Lab] complete"],
  }),
  item("energy-activator-blueprint", "Energy Activator Blueprint", "Tier2", {
    uses: [
      {
        kind: "enhancement",
        slug: "energy-activator",
        name: "Energy Activator",
      },
    ],
    recipe: {
      time: 600,
      costs: [],
      items: [
        {
          name: "Hellion",
          imageUrl: "",
          count: 1,
          recipe: null,
          from: [],
          href: null,
        },
      ],
    },
  }),
];

const offered = {
  tiers: ["ultimate", "rare"],
  materials: items.map((entry) => entry.slug),
};

describe("forText", () => {
  it("says what a card's material is for, or nothing", () => {
    expect(forText(items[0].uses)).toBe("For Ultimate Bunny");
    expect(
      forText([
        { kind: "descendant", slug: "bunny", name: "Bunny" },
        { kind: "weapon", slug: "thunder-cage", name: "Thunder Cage" },
      ]),
    ).toBe("For Bunny, Thunder Cage");
    expect(forText([])).toBe("");
  });
});

describe("filters in the URL", () => {
  it("read back what they wrote, and leave defaults out", () => {
    const filters = {
      tier: "rare",
      kind: "weapon" as const,
      query: "thunder",
      open: "thunder-cage-blueprint",
    };
    const search = coreMaterialFiltersToSearch(filters);
    expect(search).toBe(
      "?tier=rare&for=weapon&q=thunder&material=thunder-cage-blueprint",
    );
    expect(parseCoreMaterialFilters(search, offered)).toEqual(filters);
    expect(coreMaterialFiltersToSearch(defaultCoreMaterialFilters)).toBe("");
  });

  it("ignore what the page doesn't offer", () => {
    expect(
      parseCoreMaterialFilters(
        "?tier=normal&for=pets&material=nothing",
        offered,
      ),
    ).toEqual(defaultCoreMaterialFilters);
  });
});

describe("filterCoreMaterials", () => {
  const slugs = (list: readonly CoreMaterial[]) =>
    list.map((entry) => entry.slug);
  const filter = (change: object) =>
    slugs(
      filterCoreMaterials(
        items,
        { ...defaultCoreMaterialFilters, ...change },
        tiers,
      ),
    );

  it("filters by tier and by what a material goes into", () => {
    expect(filter({ tier: "ultimate" })).toEqual(["ultimate-bunny-code"]);
    expect(filter({ kind: "enhancement" })).toEqual([
      "energy-activator-blueprint",
    ]);
  });

  it("searches names, uses, ingredients, patterns and drop places", () => {
    expect(filter({ query: "BLUEPRINT" })).toEqual([
      "thunder-cage-blueprint",
      "energy-activator-blueprint",
    ]);
    expect(filter({ query: "ultimate bunny" })).toEqual([
      "ultimate-bunny-code",
    ]);
    expect(filter({ query: "hellion" })).toEqual([
      "energy-activator-blueprint",
    ]);
    expect(filter({ query: "041" })).toEqual(["ultimate-bunny-code"]);
    expect(filter({ query: "magister" })).toEqual(["thunder-cage-blueprint"]);
  });
});
