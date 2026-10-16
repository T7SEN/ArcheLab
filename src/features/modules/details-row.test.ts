import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rowEnd } from "./details-row";

describe("rowEnd", () => {
  it("puts the details after the last card of the opened card's row", () => {
    // Five columns, 12 cards: rows 0–4, 5–9, 10–11.
    expect(rowEnd(0, 5, 12)).toBe(4);
    expect(rowEnd(4, 5, 12)).toBe(4);
    expect(rowEnd(5, 5, 12)).toBe(9);
    expect(rowEnd(7, 2, 12)).toBe(7);
    expect(rowEnd(6, 2, 12)).toBe(7);
  });

  it("stops at the last card in a row that isn't full", () => {
    expect(rowEnd(10, 5, 12)).toBe(11);
    expect(rowEnd(0, 5, 1)).toBe(0);
  });

  it("always lands in the opened card's row, at or after it", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 600 }),
        fc.nat(),
        (columns, count, seed) => {
          const index = seed % count;
          const end = rowEnd(index, columns, count);
          expect(end).toBeGreaterThanOrEqual(index);
          expect(end).toBeLessThan(count);
          expect(Math.floor(end / columns)).toBe(Math.floor(index / columns));
        },
      ),
    );
  });
});
