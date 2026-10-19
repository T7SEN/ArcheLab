import { describe, expect, it } from "vitest";
import {
  amorphousFiltersToSearch,
  buildHref,
  defaultAmorphousFilters,
  filterAmorphous,
  parseAmorphousFilters,
  rateText,
  type AmorphousBuild,
  type AmorphousPattern,
  type BuildKind,
} from "./amorphous-filters";

const art = "https://open.api.nexon.com/static/tfd/img/0";
const bunny: AmorphousBuild = {
  kind: "descendant",
  slug: "bunny",
  name: "Bunny",
};
const valby: AmorphousBuild = {
  kind: "descendant",
  slug: "ultimate-valby",
  name: "Ultimate Valby",
};
const albion: AmorphousBuild = {
  kind: "weapon",
  slug: "albion-cavalry-gun",
  name: "Albion Cavalry Gun",
};

const reward = (name: string, rate: number, build: AmorphousBuild | null) => ({
  id: name,
  name,
  imageUrl: art,
  rate,
  build,
  href: null,
});

const pattern = (
  name: string,
  kind: BuildKind,
  rewards: AmorphousPattern["rewards"],
  sources: string[] = [],
): AmorphousPattern => ({
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  tier: name === "Bunny" ? "Tier2" : "Tier3",
  kind,
  imageUrl: art,
  rewards,
  sources,
});

const patterns = [
  pattern("Albion Cavalry Gun", "weapon", [
    reward("Albion Cavalry Gun Blueprint", 20, albion),
    reward("Albion Cavalry Gun Nano Tube Blueprint", 20, albion),
    reward("Energy Activator Blueprint", 20, null),
  ]),
  pattern("Ultimate Valby", "descendant", [
    reward("Ultimate Valby Code", 20, valby),
    reward("Crystallization Catalyst Blueprint", 20, null),
  ]),
  pattern("Orca", "vehicle", [reward("Orca Engine Blueprint", 20, null)]),
  pattern(
    "Bunny",
    "descendant",
    [reward("Bunny Code", 100, bunny)],
    ["[Kingston] [Normal] - [Slumber Valley] complete"],
  ),
];

const offered = { patterns: patterns.map((entry) => entry.slug) };
const shown = (search: string) =>
  filterAmorphous(patterns, parseAmorphousFilters(search, offered)).map(
    (entry) => entry.name,
  );

describe("Amorphous Material Patterns", () => {
  it("show chances as the game does", () => {
    expect(rateText(38)).toBe("38%");
    expect(rateText(2.5)).toBe("2.5%");
    expect(rateText(100)).toBe("100%");
  });

  it("link what a reward builds to its page or its details", () => {
    expect(buildHref(bunny)).toBe("/descendants/bunny");
    expect(buildHref(albion)).toBe("/weapons/albion-cavalry-gun");
    expect(
      buildHref({ kind: "fellow", slug: "snowy-sled-dog", name: "" }),
    ).toBe("/fellows?fellow=snowy-sled-dog");
    expect(buildHref({ kind: "vehicle", slug: "orca", name: "" })).toBe(
      "/vehicles?vehicle=orca",
    );
  });
});

describe("the Amorphous Materials index's filters in the URL", () => {
  it("reads what the patterns are for, a search and the open pattern", () => {
    expect(
      parseAmorphousFilters("?for=weapon&q=nano&pattern=bunny", offered),
    ).toEqual({
      type: null,
      kind: "weapon",
      query: "nano",
      open: "bunny",
      stabilizer: null,
    });
  });

  it("ignores values the index doesn't offer", () => {
    expect(parseAmorphousFilters("?for=module&pattern=001", offered)).toEqual(
      defaultAmorphousFilters,
    );
  });

  it("writes only what isn't a default", () => {
    expect(amorphousFiltersToSearch(defaultAmorphousFilters)).toBe("");
    expect(
      amorphousFiltersToSearch({
        ...defaultAmorphousFilters,
        kind: "fellow",
        open: "snowy-sled-dog",
      }),
    ).toBe("?for=fellow&pattern=snowy-sled-dog");
  });
});

describe("filtering Amorphous Material Patterns", () => {
  it("keeps what the patterns are for, in the index's order", () => {
    expect(shown("?for=descendant")).toEqual(["Ultimate Valby", "Bunny"]);
    expect(shown("?for=weapon")).toEqual(["Albion Cavalry Gun"]);
    expect(shown("?for=vehicle")).toEqual(["Orca"]);
    expect(shown("?for=fellow")).toEqual([]);
  });

  it("finds a word in the name, a reward, a build or where it drops", () => {
    expect(shown("?q=crystallization")).toEqual(["Ultimate Valby"]);
    expect(shown("?q=albion%20nano")).toEqual(["Albion Cavalry Gun"]);
    expect(shown("?q=slumber")).toEqual(["Bunny"]);
    expect(shown("?q=engine")).toEqual(["Orca"]);
    expect(shown("?for=weapon&q=bunny")).toEqual([]);
  });
});
