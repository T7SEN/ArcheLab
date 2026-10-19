import { describe, expect, it } from "vitest";
import { basicMaterials } from "./basic-materials";
import { miscellaneousItems } from "./miscellaneous";

const tierRank = { Tier3: 0, Tier2: 1, Tier1: 2 } as const;

describe("the Miscellaneous items", () => {
  it("are the Library's 58, Transcendent Weapon Loot's 32 boxes as one", () => {
    expect(miscellaneousItems).toHaveLength(58);
    expect(miscellaneousItems.flatMap((item) => item.ids)).toHaveLength(89);
    expect(
      miscellaneousItems.find(
        (item) => item.name === "Transcendent Weapon Loot",
      )?.ids,
    ).toHaveLength(32);
  });

  it("have unique names and NEXON ids", () => {
    const ids = miscellaneousItems.flatMap((item) => item.ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^\d{9}$/.test(id))).toBe(true);
    const names = miscellaneousItems.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("run in the Library's order: Ultimate, Rare, Normal, each A to Z", () => {
    expect(
      miscellaneousItems
        .map((item) => item.tier)
        .filter((tier, index, all) =>
          index === 0 ? true : tier !== all[index - 1],
        ),
    ).toEqual(["Tier3", "Tier2", "Tier1"]);
    const sorted = [...miscellaneousItems].sort(
      (a, b) =>
        tierRank[a.tier] - tierRank[b.tier] || a.name.localeCompare(b.name),
    );
    expect(sorted.map((item) => item.name)).toEqual(
      miscellaneousItems.map((item) => item.name),
    );
    expect(
      miscellaneousItems.filter((item) => item.tier === "Tier3"),
    ).toHaveLength(41);
  });

  it("share no id with a Basic Material, and four names", () => {
    const basicIds = new Set(basicMaterials.map((material) => material.id));
    expect(
      miscellaneousItems
        .flatMap((item) => item.ids)
        .filter((id) => basicIds.has(id)),
    ).toEqual([]);
    const basicNames = new Set(basicMaterials.map((material) => material.name));
    expect(
      miscellaneousItems
        .map((item) => item.name)
        .filter((name) => basicNames.has(name))
        .sort(),
    ).toEqual([
      "Dimensional Spectral Prism",
      "Frozen Gas Crystal",
      "Kuiper Bio Adhesive",
      "Xeno Fluid",
    ]);
  });

  it("say what Transcendent Weapon Loot gives, and nothing else's", () => {
    expect(
      miscellaneousItems.flatMap((item) =>
        item.gives === undefined ? [] : [[item.name, item.gives.href]],
      ),
    ).toEqual([["Transcendent Weapon Loot", "/weapons?tier=Transcendent"]]);
  });
});
