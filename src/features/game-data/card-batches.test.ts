import { describe, expect, it } from "vitest";
import { gridColumns, baseColumns } from "./details-row";
import { batchesThrough, cardBatch, drawnCount } from "./card-batches";

describe("card batches", () => {
  it("fills whole rows at every grid width", () => {
    for (const columns of [baseColumns, ...gridColumns.map((e) => e.columns)]) {
      expect(cardBatch % columns).toBe(0);
    }
  });

  it("needs one batch with no card named, and enough to draw a named one", () => {
    expect(batchesThrough(-1)).toBe(1);
    expect(batchesThrough(0)).toBe(1);
    expect(batchesThrough(cardBatch - 1)).toBe(1);
    expect(batchesThrough(cardBatch)).toBe(2);
    expect(batchesThrough(300)).toBe(6);
    expect(drawnCount(batchesThrough(300), 573)).toBeGreaterThan(300);
  });

  it("never draws more cards than there are, nor fewer than one batch", () => {
    expect(drawnCount(1, 573)).toBe(cardBatch);
    expect(drawnCount(3, 573)).toBe(cardBatch * 3);
    expect(drawnCount(10, 573)).toBe(573);
    expect(drawnCount(1, 12)).toBe(12);
    expect(drawnCount(0, 573)).toBe(cardBatch);
  });
});
