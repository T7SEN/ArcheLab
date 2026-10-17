import { describe, expect, it } from "vitest";
import {
  cardDescendants,
  cosmeticFiltersToSearch,
  cosmeticTypeOptions,
  defaultCosmeticFilters,
  filterCosmetics,
  parseCosmeticFilters,
  shownVersion,
  usableBy,
  type CosmeticCard,
  type CosmeticDescendant,
  type CosmeticTier,
  type CosmeticVersion,
} from "./cosmetic-filters";

const art = (id: string) =>
  `https://open.api.nexon.com/static/tfd/img/${id.padStart(32, "0")}`;

const version = (
  id: string,
  descendants: string[],
  imageUrl: string | null = art(id),
): CosmeticVersion => ({ id, imageUrl, stages: [], descendants });

const card = (
  slug: string,
  name: string,
  type: string,
  tier: string | null,
  versions: [CosmeticVersion, ...CosmeticVersion[]],
  everyone = false,
): CosmeticCard => ({
  slug,
  name,
  type,
  tier,
  description: `${name}, as NEXON describes it.`,
  everyone,
  versions,
});

const cards: CosmeticCard[] = [
  card("pajamas-body-skin", "Dinosaur Pajamas", "CharacterBodySkin", "Tier1", [
    version("1", ["lepic", "ultimate-lepic"]),
    version("2", ["bunny", "ultimate-bunny"]),
    version("3", ["enzo"]),
  ]),
  card("pajamas-head-skin", "Dinosaur Pajamas", "CharacterHeadSkin", "Tier1", [
    version("4", ["bunny"]),
  ]),
  card(
    "white-lightning-body-skin",
    "White Lightning",
    "CharacterBodySkin",
    "Tier3",
    [version("5", ["ultimate-bunny"])],
  ),
  card(
    "aquarium-back-attachment",
    "Small Aquarium",
    "CharacterBackAttachment",
    "Tier2",
    [version("6", [])],
    true,
  ),
  card("lepic-hair-head-skin", "Lepic Hair", "CharacterHeadSkin", null, [
    version("7", ["lepic"]),
  ]),
];

const tiers: CosmeticTier[] = [
  { id: "Tier3", name: "Ultimate", hex: "#F7DB78" },
  { id: "Tier2", name: "Rare", hex: "#D487F5" },
  { id: "Tier1", name: "Normal", hex: "#53B7F7" },
];

const descendants: CosmeticDescendant[] = [
  { slug: "bunny", name: "Bunny", imageUrl: "" },
  { slug: "ultimate-bunny", name: "Ultimate Bunny", imageUrl: "" },
  { slug: "enzo", name: "Enzo", imageUrl: "" },
  { slug: "lepic", name: "Lepic", imageUrl: "" },
  { slug: "ultimate-lepic", name: "Ultimate Lepic", imageUrl: "" },
];

const offered = {
  types: cosmeticTypeOptions(cards).map((type) => type.slug),
  tiers: ["ultimate", "rare", "normal"],
  descendants: descendants.map((descendant) => descendant.slug),
  cosmetics: cards.map((entry) => entry.slug),
};

const shown = (search: string) =>
  filterCosmetics(cards, parseCosmeticFilters(search, offered), {
    tiers,
    descendants,
  }).map((entry) => entry.slug);

describe("the Cosmetics index's types", () => {
  it("offers the types its cards have, in the game's order", () => {
    expect(cosmeticTypeOptions(cards)).toEqual([
      { id: "CharacterHeadSkin", slug: "head-skin", name: "Head Skin" },
      { id: "CharacterBodySkin", slug: "body-skin", name: "Body Skin" },
      {
        id: "CharacterBackAttachment",
        slug: "back-attachment",
        name: "Back Attachment",
      },
    ]);
  });

  it("puts a type NEXON adds later after the known ones", () => {
    const later = card("emote", "Wave", "Emote", "Tier1", [version("8", [])]);
    expect(
      cosmeticTypeOptions([later, ...cards]).map((type) => type.name),
    ).toEqual(["Head Skin", "Body Skin", "Back Attachment", "Emote"]);
  });
});

describe("the Cosmetics index's filters in the URL", () => {
  it("reads a type, a tier, a Descendant, the order, a search and the open cosmetic", () => {
    expect(
      parseCosmeticFilters(
        "?type=body-skin&tier=normal&descendant=bunny&sort=az&q=pajamas&cosmetic=pajamas-body-skin",
        offered,
      ),
    ).toEqual({
      type: "body-skin",
      tier: "normal",
      descendant: "bunny",
      sort: "az",
      query: "pajamas",
      open: "pajamas-body-skin",
    });
  });

  it("ignores values the index doesn't offer", () => {
    expect(
      parseCosmeticFilters(
        "?type=emote&tier=mythic&descendant=karel&sort=new&cosmetic=hat",
        offered,
      ),
    ).toEqual(defaultCosmeticFilters);
  });

  it("writes only what isn't a default", () => {
    expect(cosmeticFiltersToSearch(defaultCosmeticFilters)).toBe("");
    expect(
      cosmeticFiltersToSearch({
        ...defaultCosmeticFilters,
        descendant: "bunny",
        sort: "az",
        open: "pajamas-head-skin",
      }),
    ).toBe("?descendant=bunny&sort=az&cosmetic=pajamas-head-skin");
  });
});

describe("filtering cosmetics", () => {
  it("lists the highest tier first, then A–Z, the tierless last", () => {
    expect(shown("")).toEqual([
      "white-lightning-body-skin",
      "aquarium-back-attachment",
      "pajamas-head-skin",
      "pajamas-body-skin",
      "lepic-hair-head-skin",
    ]);
  });

  it("lists A–Z, a name's types in the game's order", () => {
    expect(shown("?sort=az")).toEqual([
      "pajamas-head-skin",
      "pajamas-body-skin",
      "lepic-hair-head-skin",
      "aquarium-back-attachment",
      "white-lightning-body-skin",
    ]);
  });

  it("keeps a type or a tier", () => {
    expect(shown("?type=head-skin")).toEqual([
      "pajamas-head-skin",
      "lepic-hair-head-skin",
    ]);
    expect(shown("?tier=ultimate")).toEqual(["white-lightning-body-skin"]);
  });

  it("keeps what a Descendant can use, every Descendant's included", () => {
    expect(shown("?descendant=enzo")).toEqual([
      "aquarium-back-attachment",
      "pajamas-body-skin",
    ]);
    expect(shown("?descendant=ultimate-bunny&type=body-skin")).toEqual([
      "white-lightning-body-skin",
      "pajamas-body-skin",
    ]);
  });

  it("finds words in the name, type, tier or a Descendant who can use it", () => {
    expect(shown("?q=bunny%20pajamas")).toEqual([
      "pajamas-head-skin",
      "pajamas-body-skin",
    ]);
    expect(shown("?q=back%20attachment")).toEqual(["aquarium-back-attachment"]);
    expect(shown("?q=ULTIMATE%20lightning")).toEqual([
      "white-lightning-body-skin",
    ]);
    expect(shown("?q=every%20descendant")).toEqual([
      "aquarium-back-attachment",
    ]);
  });
});

describe("a cosmetic's versions", () => {
  const pajamas = cards[0];

  it("shows the filtered Descendant's version, or the first", () => {
    expect(shownVersion(pajamas, null).id).toBe("1");
    expect(shownVersion(pajamas, "bunny").id).toBe("2");
    // A Descendant none of its versions names sees the first.
    expect(shownVersion(pajamas, "viessa").id).toBe("1");
  });

  it("prefers a version with art", () => {
    const partly = card("hat", "Hat", "CharacterHeadSkin", "Tier1", [
      version("9", ["bunny"], null),
      version("10", ["bunny"]),
    ]);
    expect(shownVersion(partly, null).id).toBe("10");
    expect(shownVersion(partly, "bunny").id).toBe("10");
  });

  it("names who can use it, each once", () => {
    expect(cardDescendants(pajamas)).toEqual([
      "lepic",
      "ultimate-lepic",
      "bunny",
      "ultimate-bunny",
      "enzo",
    ]);
    expect(usableBy(pajamas, "enzo")).toBe(true);
    expect(usableBy(pajamas, "viessa")).toBe(false);
    expect(usableBy(cards[3], "viessa")).toBe(true);
  });
});
