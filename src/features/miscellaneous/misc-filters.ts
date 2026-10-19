import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { groupPlaces } from "@/features/game-data/places";
import { slugOf } from "@/lib/slug";

/**
 * The Miscellaneous index's items and filters (ADR 0050): pure functions over plain
 * data, so the client grid and the unit tests share them. The tier, the search and the
 * open item live in the URL query; defaults stay out of the URL.
 */

/** A card on the index. */
export interface MiscItem {
  readonly slug: string;
  readonly name: string;
  /** NEXON's tier id: `Tier3`. */
  readonly tier: string;
  readonly imageUrl: string;
  /** Where it drops, as the game words it; empty when that isn't listed. */
  readonly sources: readonly string[];
  /**
   * Its places that have a page, by name as in `sources`: a 400% Infiltration Operation
   * or a Difficulty Level Rewards battlefield.
   */
  readonly placeLinks: Readonly<Record<string, string>>;
  /** What it gives and where that is on the site, or null. */
  readonly gives: { readonly name: string; readonly href: string } | null;
  /** The Basic Material of the same name, by its address, or null. */
  readonly basicTwin: string | null;
}

export interface MiscFilters {
  /** A tier's slug: `ultimate`. */
  readonly tier: string | null;
  /** Words every shown item holds, ignoring case. */
  readonly query: string;
  /** The item whose details are open, by its slug. */
  readonly open: string | null;
}

export const defaultMiscFilters: MiscFilters = {
  tier: null,
  query: "",
  open: null,
};

const keys = { tier: "tier", query: "q", open: "item" } as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseMiscFilters(
  search: string,
  offered: {
    readonly tiers: readonly string[];
    readonly items: readonly string[];
  },
): MiscFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    tier: pick(params.get(keys.tier), offered.tiers),
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.items),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function miscFiltersToSearch(filters: MiscFilters): string {
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

/**
 * The items that pass every filter, in the index's order. A search word may match the
 * name or where it drops, so "kingston" finds every item found there.
 */
export function filterMisc<T extends MiscItem>(
  items: readonly T[],
  filters: MiscFilters,
  tiers: readonly CosmeticTier[],
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const tierSlug = (id: string) =>
    slugOf(tiers.find((tier) => tier.id === id)?.name ?? "");
  return items.filter((item) => {
    if (filters.tier !== null && tierSlug(item.tier) !== filters.tier) {
      return false;
    }
    const text = fold([item.name, ...item.sources].join(" "));
    return words.every((word) => text.includes(word));
  });
}

/**
 * How many places an item is found in, as its card says it: "Found in 62 places". A
 * mission with two ways ("complete", "Support Complete") is one place, as its details
 * show it. Empty when none is listed.
 */
export function placesSummary(item: MiscItem): string {
  const count = groupPlaces(item.sources).reduce(
    (sum, group) => sum + group.places.length,
    0,
  );
  if (count === 0) {
    return "";
  }
  return `Found in ${String(count)} ${count === 1 ? "place" : "places"}`;
}
