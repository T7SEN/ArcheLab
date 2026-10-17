import { cosmeticTypeName, cosmeticTypes } from "@/data/cosmetics";
import { slugOf } from "@/lib/slug";

/**
 * The Cosmetics index's cards and filters (ADR 0039): pure functions over plain data,
 * so the client grid and the unit tests share them. The type, the tier, the Descendant,
 * the order, the search and the open cosmetic live in the URL query, so a filtered view
 * or a cosmetic can be shared; defaults stay out of the URL.
 */

/** One version of a cosmetic: NEXON makes many once per Descendant. */
export interface CosmeticVersion {
  /** NEXON's id. */
  readonly id: string;
  /** Null for the few NEXON lists without art. */
  readonly imageUrl: string | null;
  /** Its evolution stages' art, first stage first; empty for most. */
  readonly stages: readonly string[];
  /** Who can use it, by Descendant slug, as NEXON lists them. */
  readonly descendants: readonly string[];
}

/**
 * A card on the index: one cosmetic, with every version NEXON lists under its name,
 * type and description (T7SEN, 2026-10-17: one card per cosmetic, not per version).
 */
export interface CosmeticCard {
  readonly slug: string;
  readonly name: string;
  /** NEXON's type id, such as `CharacterHeadSkin`. */
  readonly type: string;
  /** NEXON's tier id, such as `Tier2`; null for the ones NEXON gives none. */
  readonly tier: string | null;
  readonly description: string;
  /** Every Descendant can use it (`everyDescendantTypes`). */
  readonly everyone: boolean;
  /** Lowest NEXON id first; never empty. */
  readonly versions: readonly [CosmeticVersion, ...CosmeticVersion[]];
}

/** A Descendant the filter offers. */
export interface CosmeticDescendant {
  readonly slug: string;
  readonly name: string;
  /** Their portrait; empty when NEXON's Descendant list doesn't have one. */
  readonly imageUrl: string;
}

/** A tier the filter offers, highest first, with its rarity name and color. */
export interface CosmeticTier {
  /** NEXON's tier id. */
  readonly id: string;
  /** The rarity's name: "Ultimate". */
  readonly name: string;
  readonly hex: string;
}

/** Cards' order: highest tier first, or by name. */
export type CosmeticSort = "tier" | "az";

export interface CosmeticFilters {
  /** A type's slug: `head-skin`. */
  readonly type: string | null;
  /** A tier's slug: `ultimate`. */
  readonly tier: string | null;
  /** A Descendant's slug. */
  readonly descendant: string | null;
  readonly sort: CosmeticSort;
  /** Words every shown cosmetic holds, ignoring case. */
  readonly query: string;
  /** The cosmetic whose details are open, by its slug. */
  readonly open: string | null;
}

export const defaultCosmeticFilters: CosmeticFilters = {
  type: null,
  tier: null,
  descendant: null,
  sort: "tier",
  query: "",
  open: null,
};

const keys = {
  type: "type",
  tier: "tier",
  descendant: "descendant",
  sort: "sort",
  query: "q",
  open: "cosmetic",
} as const;

/** A type as the filter offers it. */
export interface CosmeticTypeOption {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

/** The types in the index's order, then any NEXON adds later, A–Z. */
export function cosmeticTypeOptions(
  cards: readonly CosmeticCard[],
): CosmeticTypeOption[] {
  const ids = new Set(cards.map((card) => card.type));
  const known: readonly string[] = cosmeticTypes.map((type) => type.id);
  const later = [...ids]
    .filter((id) => !known.includes(id))
    .sort((a, b) => cosmeticTypeName(a).localeCompare(cosmeticTypeName(b)));
  return [...known.filter((id) => ids.has(id)), ...later].map((id) => ({
    id,
    slug: slugOf(cosmeticTypeName(id)),
    name: cosmeticTypeName(id),
  }));
}

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseCosmeticFilters(
  search: string,
  offered: {
    readonly types: readonly string[];
    readonly tiers: readonly string[];
    readonly descendants: readonly string[];
    readonly cosmetics: readonly string[];
  },
): CosmeticFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    type: pick(params.get(keys.type), offered.types),
    tier: pick(params.get(keys.tier), offered.tiers),
    descendant: pick(params.get(keys.descendant), offered.descendants),
    sort: params.get(keys.sort) === "az" ? "az" : "tier",
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.cosmetics),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function cosmeticFiltersToSearch(filters: CosmeticFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.type, filters.type],
    [keys.tier, filters.tier],
    [keys.descendant, filters.descendant],
    [keys.sort, filters.sort === "az" ? "az" : null],
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

/** Whether a Descendant can use a cosmetic: every one can, or a version lists them. */
export function usableBy(card: CosmeticCard, descendant: string): boolean {
  return (
    card.everyone ||
    card.versions.some((version) => version.descendants.includes(descendant))
  );
}

/**
 * The version a card shows: the filtered Descendant's, or the first. One with art comes
 * before one without.
 */
export function shownVersion(
  card: CosmeticCard,
  descendant: string | null,
): CosmeticVersion {
  const theirs =
    descendant === null
      ? []
      : card.versions.filter((version) =>
          version.descendants.includes(descendant),
        );
  const from = theirs.length === 0 ? card.versions : theirs;
  return (
    from.find((version) => version.imageUrl !== null) ??
    from.at(0) ??
    card.versions[0]
  );
}

/** Every Descendant the card's versions name, each once, in the versions' order. */
export function cardDescendants(card: CosmeticCard): string[] {
  return [...new Set(card.versions.flatMap((version) => version.descendants))];
}

/** Text as the search compares it: lowercase, with curly apostrophes as straight ones. */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/**
 * The cards that pass every filter, in the chosen order. A search word may match the
 * name, the type, the tier or a Descendant who can use it, so "bunny pajamas" finds
 * the pajamas Bunny wears.
 */
export function filterCosmetics<T extends CosmeticCard>(
  cards: readonly T[],
  filters: CosmeticFilters,
  options: {
    readonly tiers: readonly CosmeticTier[];
    readonly descendants: readonly CosmeticDescendant[];
  },
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const names = new Map(
    options.descendants.map((descendant) => [descendant.slug, descendant.name]),
  );
  const tierName = (id: string | null) =>
    options.tiers.find((tier) => tier.id === id)?.name ?? "";
  const tierRank = (id: string | null) => {
    const rank = options.tiers.findIndex((tier) => tier.id === id);
    return rank === -1 ? options.tiers.length : rank;
  };
  const typeRank = (id: string) => {
    const rank = cosmeticTypes.findIndex((type) => type.id === id);
    return rank === -1 ? cosmeticTypes.length : rank;
  };
  const shown = cards.filter((card) => {
    if (
      filters.type !== null &&
      slugOf(cosmeticTypeName(card.type)) !== filters.type
    ) {
      return false;
    }
    if (filters.tier !== null && slugOf(tierName(card.tier)) !== filters.tier) {
      return false;
    }
    if (filters.descendant !== null && !usableBy(card, filters.descendant)) {
      return false;
    }
    if (words.length === 0) {
      return true;
    }
    const text = fold(
      [
        card.name,
        cosmeticTypeName(card.type),
        tierName(card.tier),
        card.everyone ? "Every Descendant" : "",
        ...cardDescendants(card).map((slug) => names.get(slug) ?? ""),
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
  return shown.sort(
    (a, b) =>
      (filters.sort === "tier" ? tierRank(a.tier) - tierRank(b.tier) : 0) ||
      a.name.localeCompare(b.name) ||
      typeRank(a.type) - typeRank(b.type),
  );
}
