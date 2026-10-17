/**
 * The external components index's filters (ADR 0027): pure functions over plain data,
 * so the client grid and the unit tests share them. The filters and the open card live
 * in the URL query, so a filtered view or a card can be shared; defaults stay out of it.
 */

/** A piece as the index knows it: its facts, without its levels. */
export interface ComponentPieceCard {
  /** NEXON's component id. */
  readonly id: string;
  readonly name: string;
  readonly slot: string;
  /** The tier's rarity name, such as "Ultimate". */
  readonly tier: string;
  readonly hex: string;
  readonly imageUrl: string;
  /** Its base stat's name, such as "Max HP". */
  readonly stat: string | null;
  readonly coreSlots: number;
}

/** A card on the index: a set's four pieces, or one name's pieces at every tier. */
export interface ComponentCard {
  readonly slug: string;
  readonly name: string;
  readonly kind: "set" | "standalone";
  readonly bonuses: readonly {
    readonly count: number;
    readonly effect: string;
  }[];
  /** Highest tier first, then in slot order. */
  readonly pieces: readonly ComponentPieceCard[];
}

export interface ComponentFilters {
  readonly tier: string | null;
  /** Words every shown card has in its name, its pieces' names or its bonuses. */
  readonly query: string;
  /** The card whose details are open, by its address. */
  readonly open: string | null;
}

export const defaultComponentFilters: ComponentFilters = {
  tier: null,
  query: "",
  open: null,
};

const keys = { tier: "tier", query: "q", open: "component" } as const;

/** What the index's filters offer; tiers run highest first. */
export interface ComponentOptions {
  readonly tiers: readonly string[];
  readonly cards: readonly string[];
}

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseComponentFilters(
  search: string,
  offered: ComponentOptions,
): ComponentFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    tier: pick(params.get(keys.tier), offered.tiers),
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.cards),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function componentFiltersToSearch(filters: ComponentFilters): string {
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

/** Text as search compares it: lowercase, with curly apostrophes as straight ones. */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/**
 * The cards with a piece of the chosen tier and every searched word in their name,
 * their pieces' names or their bonuses ("volcanic sensor" finds Active Volcano, "fire"
 * the sets with a Fire bonus), by highest tier (the order of `tiers`), then A–Z.
 */
export function filterComponents<T extends ComponentCard>(
  cards: readonly T[],
  filters: ComponentFilters,
  tiers: readonly string[],
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const best = (card: T) =>
    Math.min(
      ...card.pieces.map((piece) => {
        const at = tiers.indexOf(piece.tier);
        return at === -1 ? tiers.length : at;
      }),
    );
  return cards
    .filter((card) => {
      const text = fold(
        [
          card.name,
          ...card.pieces.map((piece) => piece.name),
          ...card.bonuses.map((bonus) => bonus.effect),
        ].join("\n"),
      );
      return (
        (filters.tier === null ||
          card.pieces.some((piece) => piece.tier === filters.tier)) &&
        words.every((word) => text.includes(word))
      );
    })
    .sort((a, b) => best(a) - best(b) || a.name.localeCompare(b.name));
}
