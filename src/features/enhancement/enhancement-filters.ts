import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import type { Recipe } from "@/lib/nexon/recipe";
import { slugOf } from "@/lib/slug";

/**
 * The Enhancement Materials index's items and filters (ADR 0043): pure functions over
 * plain data, so the client grid and the unit tests share them. The tier, the search
 * and the open item live in the URL query; defaults stay out of the URL.
 */

/** A card on the index: one item, with every way to research it. */
export interface EnhancementMaterial {
  readonly slug: string;
  readonly name: string;
  /** NEXON's tier id (`Tier3`), from the Library; null for an item it doesn't list. */
  readonly tier: string | null;
  /** The Library's description; empty for an item it doesn't list. */
  readonly description: string;
  readonly imageUrl: string;
  /** Each way to research it, in NEXON's order; never empty. */
  readonly recipes: readonly Recipe[];
  /** Where it also drops, as the game words it. */
  readonly sources: readonly string[];
  /** Its places that have a page, by name as in `sources` (ADR 0050). */
  readonly placeLinks?: Readonly<Record<string, string>>;
}

export interface EnhancementFilters {
  /** A tier's slug: `ultimate`. */
  readonly tier: string | null;
  /** Words every shown item holds, ignoring case. */
  readonly query: string;
  /** The item whose details are open, by its slug. */
  readonly open: string | null;
}

export const defaultEnhancementFilters: EnhancementFilters = {
  tier: null,
  query: "",
  open: null,
};

const keys = { tier: "tier", query: "q", open: "material" } as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseEnhancementFilters(
  search: string,
  offered: {
    readonly tiers: readonly string[];
    readonly materials: readonly string[];
  },
): EnhancementFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    tier: pick(params.get(keys.tier), offered.tiers),
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.materials),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function enhancementFiltersToSearch(
  filters: EnhancementFilters,
): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.tier, filters.tier],
    [keys.query, filters.query === "" ? null : filters.query],
    [keys.open, filters.open],
  ];
  for (const [key, value] of values) {
    if (value !== null) {
      params.set(key, value);
    }
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}

/** Text as the search compares it: lowercase, with curly apostrophes as straight ones. */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/** Every item a recipe names, its parts' own recipes included. */
function ingredientNames(recipe: Recipe): string[] {
  return recipe.items.flatMap((item) => [
    item.name,
    ...(item.recipe === null ? [] : ingredientNames(item.recipe)),
  ]);
}

/**
 * The items that pass every filter, in the index's order. A search word may match the
 * name, the description or an ingredient, so "archive shard" finds everything
 * researched from Archive Shards.
 */
export function filterEnhancement<T extends EnhancementMaterial>(
  items: readonly T[],
  filters: EnhancementFilters,
  tiers: readonly CosmeticTier[],
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const tierSlug = (id: string | null) =>
    slugOf(tiers.find((tier) => tier.id === id)?.name ?? "");
  return items.filter((item) => {
    if (filters.tier !== null && tierSlug(item.tier) !== filters.tier) {
      return false;
    }
    const text = fold(
      [
        item.name,
        item.description,
        ...item.recipes.flatMap(ingredientNames),
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}

/**
 * A way's title, for an item with several: what it is researched from, its first
 * ingredient ("From Archive Shard").
 */
export function wayTitle(recipe: Recipe): string {
  const first = recipe.items.at(0);
  return first === undefined ? "Research" : `From ${first.name}`;
}
