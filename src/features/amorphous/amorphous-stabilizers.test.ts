import { describe, expect, it } from "vitest";
import {
  amorphousFiltersToSearch,
  defaultAmorphousFilters,
  filterAmorphous,
  filterStabilizers,
  parseAmorphousFilters,
  type AmorphousPattern,
  type ShapeStabilizer,
} from "./amorphous-filters";

const stabilizer = (form: number, uses: string[]): ShapeStabilizer => ({
  slug: `shape-stabilizer-form-${String(form)}`,
  name: `Shape Stabilizer Form ${String(form)}`,
  tier: "Tier3",
  description: "",
  imageUrl: "",
  uses: uses.map((name) => ({ name, imageUrl: "", href: "", count: 1 })),
  sources: [`[Hagios] [Hard] - [The Haven ${String(form)}] complete`],
});

const stabilizers = [
  stabilizer(1, ["Advanced Shape Stabilizer Form 1"]),
  stabilizer(3, ["Advanced Shape Stabilizer Form 3"]),
];

const pattern: AmorphousPattern = {
  slug: "120",
  name: "120",
  tier: "Tier3",
  kind: "descendant",
  imageUrl: "",
  rewards: [],
  sources: [],
};

const offered = {
  patterns: ["120"],
  stabilizers: stabilizers.map((entry) => entry.slug),
};

describe("Shape Stabilizers in the URL", () => {
  it("read back the Type filter and an open Shape Stabilizer", () => {
    const filters = {
      ...defaultAmorphousFilters,
      type: "stabilizers" as const,
      stabilizer: "shape-stabilizer-form-3",
    };
    const search = amorphousFiltersToSearch(filters);
    expect(search).toBe("?type=stabilizers&stabilizer=shape-stabilizer-form-3");
    expect(parseAmorphousFilters(search, offered)).toEqual(filters);
  });

  it("drop a For pick while only Shape Stabilizers show, and an unknown one", () => {
    expect(
      parseAmorphousFilters("?type=stabilizers&for=descendant", offered).kind,
    ).toBeNull();
    expect(
      parseAmorphousFilters("?stabilizer=shape-stabilizer-form-9", offered)
        .stabilizer,
    ).toBeNull();
  });

  it("keep one details row: an open pattern wins", () => {
    expect(
      parseAmorphousFilters(
        "?pattern=120&stabilizer=shape-stabilizer-form-1",
        offered,
      ),
    ).toMatchObject({ open: "120", stabilizer: null });
  });
});

describe("filterStabilizers", () => {
  const names = (list: readonly ShapeStabilizer[]) =>
    list.map((entry) => entry.name);

  it("shows them with no filter or Type Shape Stabilizers, and hides them otherwise", () => {
    expect(
      names(filterStabilizers(stabilizers, defaultAmorphousFilters)),
    ).toEqual(["Shape Stabilizer Form 1", "Shape Stabilizer Form 3"]);
    expect(
      filterStabilizers(stabilizers, {
        ...defaultAmorphousFilters,
        type: "patterns",
      }),
    ).toEqual([]);
    expect(
      filterStabilizers(stabilizers, {
        ...defaultAmorphousFilters,
        kind: "weapon",
      }),
    ).toEqual([]);
    expect(
      filterAmorphous([pattern], {
        ...defaultAmorphousFilters,
        type: "stabilizers",
      }),
    ).toEqual([]);
  });

  it("searches names, what they go into and where they drop", () => {
    const search = (query: string) =>
      names(
        filterStabilizers(stabilizers, { ...defaultAmorphousFilters, query }),
      );
    expect(search("advanced form 3")).toEqual(["Shape Stabilizer Form 3"]);
    expect(search("haven 1")).toEqual(["Shape Stabilizer Form 1"]);
  });
});
