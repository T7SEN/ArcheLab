/**
 * A long index draws its cards a batch at a time (T7SEN, 2026-10-17, like tfdhub.gg's
 * modules page; ADR 0031): one batch at first, another each time the page nears the
 * last card drawn.
 */

/** Cards per batch: full rows at every width the grid has (2, 3, 4 and 5 columns). */
export const cardBatch = 60;

/**
 * The batches needed to draw the card at `index`; one when no card is named (-1). A
 * shorter index passes a smaller `size`, so its cards still arrive as the page scrolls.
 */
export function batchesThrough(
  index: number,
  size: number = cardBatch,
): number {
  return index < 0 ? 1 : Math.floor(index / size) + 1;
}

/** How many of `total` cards `batches` batches of `size` draw. */
export function drawnCount(
  batches: number,
  total: number,
  size: number = cardBatch,
): number {
  return Math.min(total, Math.max(1, batches) * size);
}
