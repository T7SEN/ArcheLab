/**
 * The Descendants index's filters (ADR 0023): pure functions over plain data, so the
 * client grid and the unit tests share them. The filters live in the URL query, so a
 * filtered view can be shared; defaults stay out of the URL.
 */

/** What the index needs of each Descendant. */
export interface IndexCard {
  readonly slug: string;
  readonly name: string;
  readonly ultimate: boolean;
  readonly elements: readonly string[];
  readonly archeTypes: readonly string[];
}

export type Kind = "all" | "base" | "ultimate";
export type Sort = "newest" | "az";

export interface Filters {
  /** An attribute every shown Descendant has, or null for all. */
  readonly attribute: string | null;
  /** An Arche type every shown Descendant has skills of, or null for all. */
  readonly archeType: string | null;
  readonly kind: Kind;
  /** Words every shown name contains, ignoring case. */
  readonly query: string;
  /** NEXON's order (newest first) or A–Z. */
  readonly sort: Sort;
}

export const defaultFilters: Filters = {
  attribute: null,
  archeType: null,
  kind: "all",
  query: "",
  sort: "newest",
};

const keys = {
  attribute: "attribute",
  archeType: "arche",
  kind: "kind",
  query: "q",
  sort: "sort",
} as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseFilters(
  search: string,
  offered: {
    readonly attributes: readonly string[];
    readonly archeTypes: readonly string[];
  },
): Filters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  const kind = params.get(keys.kind);
  return {
    attribute: pick(params.get(keys.attribute), offered.attributes),
    archeType: pick(params.get(keys.archeType), offered.archeTypes),
    kind: kind === "base" || kind === "ultimate" ? kind : "all",
    query: params.get(keys.query) ?? "",
    sort: params.get(keys.sort) === "az" ? "az" : "newest",
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function filtersToSearch(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.attribute !== null) {
    params.set(keys.attribute, filters.attribute);
  }
  if (filters.archeType !== null) {
    params.set(keys.archeType, filters.archeType);
  }
  if (filters.kind !== "all") {
    params.set(keys.kind, filters.kind);
  }
  if (filters.query !== "") {
    params.set(keys.query, filters.query);
  }
  if (filters.sort !== "newest") {
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
export function filterDescendants<T extends IndexCard>(
  cards: readonly T[],
  filters: Filters,
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const shown = cards.filter(
    (card) =>
      (filters.attribute === null ||
        card.elements.includes(filters.attribute)) &&
      (filters.archeType === null ||
        card.archeTypes.includes(filters.archeType)) &&
      (filters.kind === "all" ||
        (filters.kind === "ultimate") === card.ultimate) &&
      words.every((word) => fold(card.name).includes(word)),
  );
  return filters.sort === "az"
    ? [...shown].sort((a, b) => a.name.localeCompare(b.name))
    : shown;
}
