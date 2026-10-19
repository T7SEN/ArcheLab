import { describe, expect, it } from "vitest";
import {
  defaultOperation400Filters,
  operation400FiltersToSearch,
  parseOperation400Filters,
  rewardEntries,
  type Drop400,
} from "./operation-filters";

const offered = { today: 68, operations: ["the-shelter", "caligo-ossuary"] };

describe("filters in the URL", () => {
  it("read back what they wrote", () => {
    const filters = { day: 70, open: "the-shelter" };
    const search = operation400FiltersToSearch(filters);
    expect(search).toBe("?day=2026-10-20&operation=the-shelter");
    expect(parseOperation400Filters(search, offered)).toEqual(filters);
    expect(operation400FiltersToSearch(defaultOperation400Filters)).toBe("");
  });

  it("show today for today, a past day or one past the seven weeks", () => {
    const day = (key: string) =>
      parseOperation400Filters(`?day=${key}`, offered).day;
    expect(day("2026-10-18")).toBeNull();
    expect(day("2026-10-01")).toBeNull();
    // 48 days ahead is the last day shown; 49 is the next cycle's week.
    expect(day("2026-12-05")).toBe(116);
    expect(day("2026-12-06")).toBeNull();
    // Before the browser knows today, no day after it can be picked.
    expect(
      parseOperation400Filters("?day=2026-10-20", { ...offered, today: null })
        .day,
    ).toBeNull();
  });

  it("ignore an operation the page doesn't have", () => {
    expect(
      parseOperation400Filters("?operation=the-haven", offered).open,
    ).toBeNull();
  });
});

const drop = (
  name: string,
  kind: Drop400["kind"],
  ways: string[] = ["complete"],
): Drop400 => ({
  name,
  imageUrl: `art/${name}`,
  kind,
  href: kind === "core" ? "/cores?core=defense" : null,
  ways,
});

describe("rewardEntries", () => {
  it("lists every grade of a core as one reward, at its first grade's place", () => {
    const entries = rewardEntries([
      drop("Code Breaker", "material"),
      drop("Defense Augmentation Core VIII", "core", ["complete"]),
      drop("Collectible Coin", "material"),
      drop("Defense Augmentation Core VII", "core", ["Mission Monster"]),
      drop("Defense Augmentation Core X", "core"),
      drop("Defense Augmentation Core IX", "core"),
    ]);
    expect(entries.map((entry) => [entry.name, entry.grades])).toEqual([
      ["Code Breaker", null],
      ["Defense Augmentation Core", "VII–X"],
      ["Collectible Coin", null],
    ]);
    // The highest grade's art and page, and every way any grade comes.
    expect(entries[1]).toMatchObject({
      imageUrl: "art/Defense Augmentation Core X",
      href: "/cores?core=defense",
      ways: ["complete", "Mission Monster"],
    });
  });

  it("writes grades that skip one apart, and a lone grade alone", () => {
    expect(
      rewardEntries([
        drop("Hit Augmentation Core VII", "core"),
        drop("Hit Augmentation Core V", "core"),
        drop("Recovery Augmentation Core IX", "core"),
      ]).map((entry) => entry.grades),
    ).toEqual(["V, VII", "IX"]);
  });

  it("leaves a material named like a grade alone", () => {
    expect(rewardEntries([drop("Decryption Key II", "material")])).toEqual([
      { ...drop("Decryption Key II", "material"), grades: null },
    ]);
  });
});
