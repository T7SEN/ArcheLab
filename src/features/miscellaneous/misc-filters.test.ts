import { describe, expect, it } from "vitest";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import {
  defaultMiscFilters,
  filterMisc,
  miscFiltersToSearch,
  parseMiscFilters,
  placesSummary,
  type MiscItem,
} from "./misc-filters";

const tiers: CosmeticTier[] = [
  { id: "Tier3", name: "Ultimate", hex: "#F7DB78" },
  { id: "Tier1", name: "Normal", hex: "#53B7F7" },
];

const item = (
  slug: string,
  name: string,
  tier: string,
  sources: string[] = [],
): MiscItem => ({
  slug,
  name,
  tier,
  imageUrl: "",
  sources,
  placeLinks: {},
  gives: null,
  basicTwin: null,
});

const items = [
  item("standard-eta-voucher", "Standard ETA Voucher", "Tier3", [
    "[Kingston] [Hard] - [Magister Lab] Mission Monster",
  ]),
  item("collectible-coin", "Collectible Coin", "Tier1", [
    "[Bounty Operations] - [Hungry Abyss Scarab] - [Sync Loot Reward]",
    "[Vespers] [Hard] - [The Shelter] complete",
  ]),
  item("trade-permit", "Trade Permit", "Tier3"),
];

const offered = {
  tiers: ["ultimate", "normal"],
  items: items.map((entry) => entry.slug),
};

describe("filters in the URL", () => {
  it("read back what they wrote, and leave defaults out", () => {
    const filters = { tier: "normal", query: "coin", open: "collectible-coin" };
    const search = miscFiltersToSearch(filters);
    expect(search).toBe("?tier=normal&q=coin&item=collectible-coin");
    expect(parseMiscFilters(search, offered)).toEqual(filters);
    expect(miscFiltersToSearch(defaultMiscFilters)).toBe("");
  });

  it("ignore a tier or item the page doesn't offer", () => {
    expect(parseMiscFilters("?tier=rare&item=gold", offered)).toEqual(
      defaultMiscFilters,
    );
  });
});

describe("filterMisc", () => {
  const slugs = (list: readonly MiscItem[]) => list.map((entry) => entry.slug);

  it("keeps the order and filters by tier", () => {
    expect(
      slugs(
        filterMisc(items, { ...defaultMiscFilters, tier: "ultimate" }, tiers),
      ),
    ).toEqual(["standard-eta-voucher", "trade-permit"]);
  });

  it("searches names and drop places, ignoring case", () => {
    const search = (query: string) =>
      slugs(filterMisc(items, { ...defaultMiscFilters, query }, tiers));
    expect(search("VOUCHER")).toEqual(["standard-eta-voucher"]);
    expect(search("shelter")).toEqual(["collectible-coin"]);
    expect(search("kingston magister")).toEqual(["standard-eta-voucher"]);
    expect(search("  ")).toEqual(slugs(items));
  });
});

describe("placesSummary", () => {
  it("counts places as the details show them, a place's ways as one", () => {
    expect(
      placesSummary(
        item("x", "X", "Tier3", [
          "[Vespers] [Hard] - [The Shelter] complete",
          "[Vespers] [Hard] - [The Shelter] Mission Monster",
          "[Vespers] [Hard] - [Sepulcher] complete",
        ]),
      ),
    ).toBe("Found in 2 places");
    expect(placesSummary(items[0])).toBe("Found in 1 place");
    expect(placesSummary(items[2])).toBe("");
  });
});
