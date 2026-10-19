/**
 * The reactors index's filters (ADR 0026): pure functions over plain data, so the client
 * grid and the unit tests share them. The filters and the open reactor live in the URL
 * query, so a filtered view or a reactor can be shared; defaults stay out of the URL.
 */

/** A reactor at one tier, as the index knows it. */
export interface ReactorTierCard {
  /** NEXON's reactor id. */
  readonly id: string;
  /** The tier's rarity name, such as "Ultimate". */
  readonly name: string;
  readonly hex: string;
  readonly imageUrl: string;
}

/** A card on the index: a reactor with its tiers. */
export interface ReactorCard {
  readonly slug: string;
  readonly name: string;
  readonly attribute: string | null;
  readonly archeType: string | null;
  /**
   * The Difficulty Level Rewards page with its attribute and Arche type picked, when a
   * week rewards them (ADR 0050).
   */
  readonly rewardHref?: string;
  readonly boosts: readonly { readonly name: string; readonly value: number }[];
  /** Highest tier first. */
  readonly tiers: readonly ReactorTierCard[];
  /** The Descendants it suits, newest first. */
  readonly descendants: readonly {
    readonly slug: string;
    readonly name: string;
    readonly imageUrl: string;
  }[];
}

export interface ReactorFilters {
  readonly attribute: string | null;
  readonly archeType: string | null;
  /** Words every shown name contains, ignoring case. */
  readonly query: string;
  /** The reactor whose details are open, by its address. */
  readonly open: string | null;
}

export const defaultReactorFilters: ReactorFilters = {
  attribute: null,
  archeType: null,
  query: "",
  open: null,
};

const keys = {
  attribute: "attribute",
  archeType: "type",
  query: "q",
  open: "reactor",
} as const;

/** What the index's filters offer. */
export interface ReactorOptions {
  readonly attributes: readonly string[];
  readonly archeTypes: readonly string[];
  readonly reactors: readonly string[];
}

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseReactorFilters(
  search: string,
  offered: ReactorOptions,
): ReactorFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    attribute: pick(params.get(keys.attribute), offered.attributes),
    archeType: pick(params.get(keys.archeType), offered.archeTypes),
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.reactors),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function reactorFiltersToSearch(filters: ReactorFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.attribute, filters.attribute],
    [keys.archeType, filters.archeType],
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

/** Text as name search compares it: lowercase, with curly apostrophes as straight ones. */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/**
 * The cards that pass every filter, A–Z. A search word may match the name, the
 * attribute or the Arche type, so "fire" finds every Burning reactor.
 */
export function filterReactors<T extends ReactorCard>(
  cards: readonly T[],
  filters: ReactorFilters,
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  return cards
    .filter(
      (card) =>
        (filters.attribute === null || card.attribute === filters.attribute) &&
        (filters.archeType === null || card.archeType === filters.archeType) &&
        words.every((word) =>
          [card.name, card.attribute ?? "", card.archeType ?? ""].some((text) =>
            fold(text).includes(word),
          ),
        ),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
