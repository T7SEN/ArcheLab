/**
 * The weapons index's filters (ADR 0024): pure functions over plain data, so the client
 * grid and the unit tests share them. The filters live in the URL query, so a filtered
 * view can be shared; defaults stay out of the URL.
 */

/** What the index needs of each weapon. */
export interface WeaponCard {
  readonly slug: string;
  readonly name: string;
  /** The tier's rarity name, such as "Transcendent". */
  readonly tier: string;
  readonly type: string;
  readonly rounds: string | null;
}

/** The index's order (highest tier first, then by type), or A–Z. */
export type WeaponSort = "tier" | "az";

export interface WeaponFilters {
  readonly tier: string | null;
  readonly type: string | null;
  readonly rounds: string | null;
  /** Words every shown name contains, ignoring case. */
  readonly query: string;
  readonly sort: WeaponSort;
}

export const defaultWeaponFilters: WeaponFilters = {
  tier: null,
  type: null,
  rounds: null,
  query: "",
  sort: "tier",
};

const keys = {
  tier: "tier",
  type: "type",
  rounds: "rounds",
  query: "q",
  sort: "sort",
} as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseWeaponFilters(
  search: string,
  offered: {
    readonly tiers: readonly string[];
    readonly types: readonly string[];
    readonly rounds: readonly string[];
  },
): WeaponFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    tier: pick(params.get(keys.tier), offered.tiers),
    type: pick(params.get(keys.type), offered.types),
    rounds: pick(params.get(keys.rounds), offered.rounds),
    query: params.get(keys.query) ?? "",
    sort: params.get(keys.sort) === "az" ? "az" : "tier",
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function weaponFiltersToSearch(filters: WeaponFilters): string {
  const params = new URLSearchParams();
  if (filters.tier !== null) {
    params.set(keys.tier, filters.tier);
  }
  if (filters.type !== null) {
    params.set(keys.type, filters.type);
  }
  if (filters.rounds !== null) {
    params.set(keys.rounds, filters.rounds);
  }
  if (filters.query !== "") {
    params.set(keys.query, filters.query);
  }
  if (filters.sort !== "tier") {
    params.set(keys.sort, filters.sort);
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}

/**
 * Text as name search compares it: lowercase, with curly apostrophes as straight ones,
 * so "emperor’s" from a phone keyboard finds "Emperor's Guard Lance".
 */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/** The cards that pass every filter, in the chosen order. */
export function filterWeapons<T extends WeaponCard>(
  cards: readonly T[],
  filters: WeaponFilters,
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const shown = cards.filter(
    (card) =>
      (filters.tier === null || card.tier === filters.tier) &&
      (filters.type === null || card.type === filters.type) &&
      (filters.rounds === null || card.rounds === filters.rounds) &&
      words.every((word) => fold(card.name).includes(word)),
  );
  return filters.sort === "az"
    ? [...shown].sort((a, b) => a.name.localeCompare(b.name))
    : shown;
}
