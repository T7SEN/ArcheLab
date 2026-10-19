import { describe, expect, it } from "vitest";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import type { Recipe, RecipeItem } from "@/lib/nexon/recipe";
import {
  defaultEnhancementFilters,
  enhancementFiltersToSearch,
  filterEnhancement,
  parseEnhancementFilters,
  wayTitle,
  type EnhancementMaterial,
} from "./enhancement-filters";

const art = "https://open.api.nexon.com/static/tfd/img/0";
const tiers: CosmeticTier[] = [
  { id: "Tier3", name: "Ultimate", hex: "#F7DB78" },
  { id: "Tier1", name: "Normal", hex: "#53B7F7" },
];

const item = (name: string, recipe: Recipe | null = null): RecipeItem => ({
  name,
  imageUrl: art,
  count: 1,
  recipe,
  from: [],
  href: null,
});

const recipe = (...items: RecipeItem[]): Recipe => ({
  time: 60,
  costs: [],
  items,
});

const material = (
  name: string,
  tier: string,
  recipes: Recipe[],
): EnhancementMaterial => ({
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  tier,
  description: `${name} enhances something.`,
  imageUrl: art,
  recipes,
  sources: [],
});

const items = [
  material("Core Binder", "Tier3", [recipe(item("Void Abyss Metal Fragment"))]),
  material("Ion Accelerator", "Tier1", [
    recipe(item("Solenoid")),
    recipe(item("Archive Shard")),
  ]),
  material("Dimension Analyzer", "Tier3", [
    recipe(item("Ion Accelerator", recipe(item("Solenoid")))),
  ]),
];

describe("the filters in the URL", () => {
  const offered = {
    tiers: ["ultimate", "normal"],
    materials: items.map((entry) => entry.slug),
  };

  it("reads and writes every filter, and keeps defaults out", () => {
    const filters = {
      tier: "normal",
      query: "solenoid",
      open: "ion-accelerator",
    };
    const search = enhancementFiltersToSearch(filters);
    expect(search).toBe("?tier=normal&q=solenoid&material=ion-accelerator");
    expect(parseEnhancementFilters(search, offered)).toEqual(filters);
    expect(enhancementFiltersToSearch(defaultEnhancementFilters)).toBe("");
  });

  it("ignores values the index doesn't offer", () => {
    expect(
      parseEnhancementFilters("?tier=rare&material=nope", offered),
    ).toEqual(defaultEnhancementFilters);
  });
});

describe("filterEnhancement", () => {
  const names = (search: string) =>
    filterEnhancement(
      items,
      parseEnhancementFilters(search, {
        tiers: ["ultimate", "normal"],
        materials: [],
      }),
      tiers,
    ).map((entry) => entry.name);

  it("filters by tier", () => {
    expect(names("?tier=ultimate")).toEqual([
      "Core Binder",
      "Dimension Analyzer",
    ]);
  });

  it("finds an item by an ingredient, its parts' own recipes included", () => {
    expect(names("?q=solenoid")).toEqual([
      "Ion Accelerator",
      "Dimension Analyzer",
    ]);
    expect(names("?q=void%20abyss")).toEqual(["Core Binder"]);
  });
});

describe("wayTitle", () => {
  it("names a way by its first ingredient", () => {
    expect(wayTitle(recipe(item("Archive Shard"), item("Solenoid")))).toBe(
      "From Archive Shard",
    );
    expect(wayTitle(recipe())).toBe("Research");
  });
});
