import {
  mutantCellImageUrl,
  mutantCellSlug,
  mutantCellSockets,
  type MutantCell,
} from "@/data/mutant-cells";

/**
 * The Mutant Cells index's filters (ADR 0038): pure functions over plain data, so the
 * client grid and the unit tests share them. The socket, the search and the open cell
 * live in the URL query, so a filtered view or a cell can be shared; defaults stay out
 * of the URL.
 */

/** A card on the index: a cell with its address and icon. */
export interface MutantCellCard extends MutantCell {
  readonly slug: string;
  readonly imageUrl: string | null;
}

/**
 * Cards per batch (T7SEN, 2026-10-17): the modules' 60 would draw nearly all 64 cells at
 * once, so they come 20 at a time as the page scrolls. Full rows at 2, 4 and 5 columns;
 * at 3 a batch ends two cards into a row, which the next fills before it comes into view.
 */
export const mutantCellBatch = 20;

/** Every cell as a card, by socket, then A–Z (as tfdhub.gg lists them). */
export function mutantCellCards(
  cells: readonly MutantCell[],
): MutantCellCard[] {
  return cells
    .map((cell) => ({
      ...cell,
      slug: mutantCellSlug(cell.name),
      imageUrl: mutantCellImageUrl(cell.name),
    }))
    .sort(
      (a, b) =>
        mutantCellSockets.indexOf(a.socket) -
          mutantCellSockets.indexOf(b.socket) || a.name.localeCompare(b.name),
    );
}

export interface MutantCellFilters {
  readonly socket: string | null;
  /** Words every shown cell holds, ignoring case. */
  readonly query: string;
  /** The cell whose details are open, by its address. */
  readonly open: string | null;
}

export const defaultMutantCellFilters: MutantCellFilters = {
  socket: null,
  query: "",
  open: null,
};

const keys = { socket: "socket", query: "q", open: "cell" } as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseMutantCellFilters(
  search: string,
  cells: readonly string[],
): MutantCellFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  return {
    socket: pick(params.get(keys.socket), mutantCellSockets),
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), cells),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function mutantCellFiltersToSearch(filters: MutantCellFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.socket, filters.socket],
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
 * The cards that pass every filter, in their order. A search word may match the name,
 * the socket, the description or what an effect raises, so "clash" finds the cells a
 * Clash type skill sets off and "critical" the ones that raise a Critical Hit stat.
 */
export function filterMutantCells<T extends MutantCellCard>(
  cards: readonly T[],
  filters: MutantCellFilters,
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  return cards.filter((card) => {
    if (filters.socket !== null && card.socket !== filters.socket) {
      return false;
    }
    const text = fold(
      [
        card.name,
        card.socket,
        card.description,
        ...card.effects.flatMap((effect) => [
          effect.title ?? "",
          ...effect.stats.map((stat) => stat.name),
        ]),
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}
