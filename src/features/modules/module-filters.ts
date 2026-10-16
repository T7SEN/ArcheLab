/**
 * The modules index's filters (ADR 0025): pure functions over plain data, so the client
 * grid and the unit tests share them. The filters and the open module live in the URL
 * query, so a filtered view or a module can be shared; defaults stay out of the URL.
 */

/** What the index knows of one version of a module: its facts, without its levels. */
export interface ModuleVariantCard {
  /** NEXON's module id. */
  readonly id: string;
  /** What sets it apart from the other versions: "High-Power Rounds · Sniper Rifle". */
  readonly label: string;
  /** "Descendant", a firearm rounds class, or "Melee Weapon". */
  readonly category: string;
  readonly rounds: string | null;
  readonly weaponTypes: readonly string[];
  /** The tier's rarity name, such as "Transcendent". */
  readonly tier: string;
  readonly socket: string | null;
  readonly type: string | null;
  readonly slots: readonly string[];
  readonly owners: readonly { readonly slug: string; readonly name: string }[];
  readonly imageUrl: string;
  /**
   * Capacity at the lowest and the highest level, or null for none (Trigger modules).
   * It can fall as a module levels up, as Transcendent modules' does.
   */
  readonly capacity: { readonly from: number; readonly to: number } | null;
}

/** A card on the index: the modules that share a name. */
export interface ModuleCard {
  readonly slug: string;
  readonly name: string;
  readonly variants: readonly ModuleVariantCard[];
}

/** The index's order (highest tier first, then A–Z), or A–Z. */
export type ModuleSort = "tier" | "az";

export interface ModuleFilters {
  readonly tier: string | null;
  readonly socket: string | null;
  readonly category: string | null;
  readonly type: string | null;
  readonly slot: string | null;
  /** A Descendant's page address: modules only they can equip. */
  readonly owner: string | null;
  /** Words every shown name contains, ignoring case. */
  readonly query: string;
  readonly sort: ModuleSort;
  /** The module whose details are open, by its address. */
  readonly open: string | null;
}

export const defaultModuleFilters: ModuleFilters = {
  tier: null,
  socket: null,
  category: null,
  type: null,
  slot: null,
  owner: null,
  query: "",
  sort: "tier",
  open: null,
};

const keys = {
  tier: "tier",
  socket: "socket",
  category: "class",
  type: "type",
  slot: "slot",
  owner: "owner",
  query: "q",
  sort: "sort",
  open: "module",
} as const;

/** What the index's filters offer, in display order; tiers run highest first. */
export interface ModuleOptions {
  readonly tiers: readonly string[];
  readonly sockets: readonly string[];
  readonly categories: readonly string[];
  readonly types: readonly string[];
  readonly slots: readonly string[];
  readonly owners: readonly string[];
  readonly modules: readonly string[];
}

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseModuleFilters(
  search: string,
  offered: ModuleOptions,
): ModuleFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    tier: pick(params.get(keys.tier), offered.tiers),
    socket: pick(params.get(keys.socket), offered.sockets),
    category: pick(params.get(keys.category), offered.categories),
    type: pick(params.get(keys.type), offered.types),
    slot: pick(params.get(keys.slot), offered.slots),
    owner: pick(params.get(keys.owner), offered.owners),
    query: params.get(keys.query) ?? "",
    sort: params.get(keys.sort) === "az" ? "az" : "tier",
    open: pick(params.get(keys.open), offered.modules),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function moduleFiltersToSearch(filters: ModuleFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.tier, filters.tier],
    [keys.socket, filters.socket],
    [keys.category, filters.category],
    [keys.type, filters.type],
    [keys.slot, filters.slot],
    [keys.owner, filters.owner],
    [keys.query, filters.query === "" ? null : filters.query],
    [keys.sort, filters.sort === "tier" ? null : filters.sort],
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

/**
 * Text as name search compares it: lowercase, with curly apostrophes as straight ones,
 * so "hunter’s" from a phone keyboard finds "Hunter's Resolution".
 */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/**
 * A version's type when it says more than its tier. Ancestor and Trigger modules take
 * their tier from their type (`src/data/module-tiers.ts`), so theirs would repeat it.
 */
export function shownType(variant: ModuleVariantCard): string | null {
  return variant.type === variant.tier ? null : variant.type;
}

/** The versions of a card that pass every filter but the name search. */
export function matchingVariants<T extends ModuleVariantCard>(
  variants: readonly T[],
  filters: ModuleFilters,
): T[] {
  return variants.filter(
    (variant) =>
      (filters.tier === null || variant.tier === filters.tier) &&
      (filters.socket === null || variant.socket === filters.socket) &&
      (filters.category === null || variant.category === filters.category) &&
      (filters.type === null || variant.type === filters.type) &&
      (filters.slot === null || variant.slots.includes(filters.slot)) &&
      (filters.owner === null ||
        variant.owners.some((owner) => owner.slug === filters.owner)),
  );
}

/**
 * The cards with a version that passes every filter and a name that has every searched
 * word, in the chosen order: by their highest tier (the order of `tiers`), then A–Z.
 */
export function filterModules<T extends ModuleCard>(
  cards: readonly T[],
  filters: ModuleFilters,
  tiers: readonly string[],
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const shown = cards.filter(
    (card) =>
      matchingVariants(card.variants, filters).length > 0 &&
      words.every((word) => fold(card.name).includes(word)),
  );
  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  if (filters.sort === "az") {
    return [...shown].sort(byName);
  }
  const best = (card: T) =>
    Math.min(
      ...card.variants.map((variant) => {
        const at = tiers.indexOf(variant.tier);
        return at === -1 ? tiers.length : at;
      }),
    );
  return [...shown].sort((a, b) => best(a) - best(b) || byName(a, b));
}
