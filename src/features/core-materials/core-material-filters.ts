import {
  useKinds,
  type MaterialUse,
  type UseKind,
} from "@/features/basic-materials/basic-filters";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import type { Recipe } from "@/lib/nexon/recipe";
import { slugOf } from "@/lib/slug";

/**
 * The Core Materials index's items and filters (ADR 0047): pure functions over plain
 * data, so the client grid and the unit tests share them. The tier, what a material is
 * for, the search and the open material live in the URL query; defaults stay out of
 * the URL.
 */

/** An Amorphous Material Pattern in the game that gives a material, with its chance. */
export interface CoreMaterialPattern {
  readonly slug: string;
  /** The name after "Amorphous Material Pattern: ". */
  readonly name: string;
  /** The chance, in percent. */
  readonly rate: number;
}

/** A card on the index. */
export interface CoreMaterial {
  readonly slug: string;
  readonly name: string;
  /** NEXON's tier id: `Tier3` Ultimate, `Tier2` Rare. */
  readonly tier: string;
  readonly imageUrl: string;
  /** What it goes into, in `useKinds` order, then A–Z. */
  readonly uses: readonly MaterialUse[];
  /** How it is researched, when NEXON lists a recipe for it. */
  readonly recipe: Recipe | null;
  /** The patterns that give it, highest chance first. */
  readonly patterns: readonly CoreMaterialPattern[];
  /** Where else it drops, as the game words it; empty when that isn't listed. */
  readonly sources: readonly string[];
  /** Its places that have a page, by name as in `sources` (ADR 0050). */
  readonly placeLinks?: Readonly<Record<string, string>>;
}

/** What a card says a material is for: "For Ultimate Bunny"; empty when nothing. */
export function forText(uses: readonly MaterialUse[]): string {
  return uses.length === 0
    ? ""
    : `For ${uses.map((use) => use.name).join(", ")}`;
}

export interface CoreMaterialFilters {
  /** A tier's slug: `ultimate`. */
  readonly tier: string | null;
  /** What the shown materials go into. */
  readonly kind: UseKind | null;
  /** Words every shown material holds, ignoring case. */
  readonly query: string;
  /** The material whose details are open, by its slug. */
  readonly open: string | null;
}

export const defaultCoreMaterialFilters: CoreMaterialFilters = {
  tier: null,
  kind: null,
  query: "",
  open: null,
};

const keys = {
  tier: "tier",
  kind: "for",
  query: "q",
  open: "material",
} as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseCoreMaterialFilters(
  search: string,
  offered: {
    readonly tiers: readonly string[];
    readonly materials: readonly string[];
  },
): CoreMaterialFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  const kind = useKinds.find((entry) => entry.kind === params.get(keys.kind));
  return {
    tier: pick(params.get(keys.tier), offered.tiers),
    kind: kind?.kind ?? null,
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.materials),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function coreMaterialFiltersToSearch(
  filters: CoreMaterialFilters,
): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.tier, filters.tier],
    [keys.kind, filters.kind],
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

/**
 * The materials that pass every filter, in the index's order. A search word may match
 * the name, what it goes into, its ingredients, the patterns that give it or where it
 * drops, so "bunny" finds every part of Bunny and Ultimate Bunny.
 */
export function filterCoreMaterials<T extends CoreMaterial>(
  items: readonly T[],
  filters: CoreMaterialFilters,
  tiers: readonly CosmeticTier[],
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const tierSlug = (id: string) =>
    slugOf(tiers.find((tier) => tier.id === id)?.name ?? "");
  return items.filter((item) => {
    if (filters.tier !== null && tierSlug(item.tier) !== filters.tier) {
      return false;
    }
    if (
      filters.kind !== null &&
      !item.uses.some((use) => use.kind === filters.kind)
    ) {
      return false;
    }
    const text = fold(
      [
        item.name,
        ...item.uses.map((use) => use.name),
        ...(item.recipe?.items.map((part) => part.name) ?? []),
        ...item.patterns.map((pattern) => pattern.name),
        ...item.sources,
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}
