import { useSyncExternalStore } from "react";

/**
 * Where an open card's details go in an index's grid (ADR 0025, ADR 0026): a full-width
 * row right under the row of the card that opened them, so the cards keep their order.
 */

/**
 * The grid's columns at each width, widest first, matching `gridClass` (Tailwind's
 * `sm`, `lg` and `xl` breakpoints: 40rem, 64rem and 80rem).
 */
export const gridColumns: readonly {
  readonly query: string;
  readonly columns: number;
}[] = [
  { query: "(min-width: 80rem)", columns: 5 },
  { query: "(min-width: 64rem)", columns: 4 },
  { query: "(min-width: 40rem)", columns: 3 },
];

/** The columns below the narrowest breakpoint. */
export const baseColumns = 2;

/** The grid's classes; a change here changes `gridColumns` too. */
export const gridClass =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/**
 * The index of the card after which the details go: the last card in the opened card's
 * row, or the last card of all when that row isn't full.
 */
export function rowEnd(index: number, columns: number, count: number): number {
  const rowStart = Math.floor(index / columns) * columns;
  return Math.min(count - 1, rowStart + columns - 1);
}

function subscribeColumns(onChange: () => void): () => void {
  const lists = gridColumns.map((entry) => window.matchMedia(entry.query));
  for (const list of lists) {
    list.addEventListener("change", onChange);
  }
  return () => {
    for (const list of lists) {
      list.removeEventListener("change", onChange);
    }
  };
}

function readColumns(): number {
  return (
    gridColumns.find((entry) => window.matchMedia(entry.query).matches)
      ?.columns ?? baseColumns
  );
}

/** The grid's column count at the current width; `baseColumns` on the server. */
export function useGridColumns(): number {
  return useSyncExternalStore(subscribeColumns, readColumns, () => baseColumns);
}
