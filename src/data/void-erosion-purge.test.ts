import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { slugOf } from "@/lib/slug";
import { purgeCycle, purgeMapArt, purgeMapArtSize } from "./void-erosion-purge";

// tfdhub.gg's map pictures, used with tfdhub's permission (T7SEN, 2026-10-19).
describe("purgeMapArt", () => {
  it("gives every map a file in public/, named by its address, with its size", () => {
    for (const name of purgeCycle) {
      const url = purgeMapArt[name];
      expect(url, name).toBe(`/art/void-erosion-purge/${slugOf(name)}.webp`);
      expect(existsSync(join(process.cwd(), "public", url ?? "")), name).toBe(
        true,
      );
      expect(purgeMapArtSize[name]?.width, name).toBeGreaterThan(0);
      expect(purgeMapArtSize[name]?.height, name).toBeGreaterThan(0);
    }
    expect(Object.keys(purgeMapArt).sort()).toEqual([...purgeCycle].sort());
  });
});
