import { describe, expect, it } from "vitest";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import {
  basicFiltersToSearch,
  defaultBasicFilters,
  filterBasic,
  hrefOfUse,
  parseBasicFilters,
  usesSummary,
  type BasicMaterial,
  type MaterialUse,
} from "./basic-filters";

const art = "https://open.api.nexon.com/static/tfd/img/0";
const tiers: CosmeticTier[] = [
  { id: "Tier3", name: "Ultimate", hex: "#F7DB78" },
  { id: "Tier2", name: "Rare", hex: "#D487F5" },
  { id: "Tier1", name: "Normal", hex: "#53B7F7" },
];

const materialUse = (kind: MaterialUse["kind"], name: string): MaterialUse => ({
  kind,
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
});

const material = (
  name: string,
  tier: string,
  uses: MaterialUse[],
  sources: string[] = [],
): BasicMaterial => ({
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  tier,
  description: `A material used for research. ${name}.`,
  imageUrl: art,
  uses,
  sources,
});

const items = [
  material(
    "Archive Shard",
    "Tier3",
    [
      materialUse("descendant", "Ultimate Bunny"),
      materialUse("weapon", "Piercing Light"),
      materialUse("enhancement", "Ion Accelerator"),
    ],
    ["[Vespers] [Hard] - [Sepulcher] complete"],
  ),
  material(
    "Silentra",
    "Tier2",
    [materialUse("vehicle", "Orca")],
    ["[Axion Plains] [Hard] - [First Crater] Mission Monster"],
  ),
  material(
    "Repton",
    "Tier1",
    [materialUse("fellow", "Hagios Sheepdog")],
    ["[Kingston] [Normal] - [Resource Box]"],
  ),
  material("Superheated Material", "Tier3", []),
];

describe("usesSummary", () => {
  it("counts each kind a material goes into, in the filter's order", () => {
    expect(
      usesSummary([
        materialUse("weapon", "A"),
        materialUse("descendant", "B"),
        materialUse("weapon", "C"),
        materialUse("enhancement", "D"),
      ]),
    ).toBe("1 Descendant · 2 weapons · 1 Enhancement Material");
    expect(usesSummary([])).toBe("");
  });
});

describe("hrefOfUse", () => {
  it("opens each use's page or its details on its index", () => {
    expect(hrefOfUse(materialUse("descendant", "Ultimate Bunny"))).toBe(
      "/descendants/ultimate-bunny",
    );
    expect(hrefOfUse(materialUse("weapon", "Piercing Light"))).toBe(
      "/weapons/piercing-light",
    );
    expect(hrefOfUse(materialUse("enhancement", "Ion Accelerator"))).toBe(
      "/enhancement-materials?material=ion-accelerator",
    );
    expect(hrefOfUse(materialUse("fellow", "Hagios Sheepdog"))).toBe(
      "/fellows?fellow=hagios-sheepdog",
    );
    expect(hrefOfUse(materialUse("vehicle", "Orca"))).toBe(
      "/vehicles?vehicle=orca",
    );
  });
});

describe("the filters in the URL", () => {
  const offered = {
    tiers: ["ultimate", "rare", "normal"],
    materials: items.map((item) => item.slug),
  };

  it("reads and writes every filter, and keeps defaults out", () => {
    const filters = {
      tier: "rare",
      kind: "vehicle",
      query: "orca",
      open: "silentra",
    } as const;
    const search = basicFiltersToSearch(filters);
    expect(search).toBe("?tier=rare&for=vehicle&q=orca&material=silentra");
    expect(parseBasicFilters(search, offered)).toEqual(filters);
    expect(basicFiltersToSearch(defaultBasicFilters)).toBe("");
  });

  it("ignores values the index doesn't offer", () => {
    expect(
      parseBasicFilters("?tier=mythic&for=boats&material=nope", offered),
    ).toEqual(defaultBasicFilters);
  });
});

describe("filterBasic", () => {
  const names = (search: string) =>
    filterBasic(
      items,
      parseBasicFilters(search, {
        tiers: ["ultimate", "rare", "normal"],
        materials: [],
      }),
      tiers,
    ).map((item) => item.name);

  it("filters by tier and by what a material goes into", () => {
    expect(names("?tier=ultimate")).toEqual([
      "Archive Shard",
      "Superheated Material",
    ]);
    expect(names("?for=enhancement")).toEqual(["Archive Shard"]);
    expect(names("?for=fellow")).toEqual(["Repton"]);
  });

  it("finds a material by what it goes into or where it drops", () => {
    expect(names("?q=bunny")).toEqual(["Archive Shard"]);
    expect(names("?q=kingston")).toEqual(["Repton"]);
    expect(names("?q=first%20crater")).toEqual(["Silentra"]);
    expect(names("?q=nothing-like-this")).toEqual([]);
  });
});
