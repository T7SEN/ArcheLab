import { describe, expect, it } from "vitest";
import {
  cosmeticDescendantOrder,
  cosmeticIndex,
  type CosmeticRecord,
} from "./cosmetic-index";
import { imageHost } from "./metadata";

/** A cosmetic shaped like NEXON's (read 2026-10-17). */
const record = (
  id: string,
  name: string,
  type: string,
  descendants: string[],
  extra: Partial<CosmeticRecord> = {},
): CosmeticRecord => ({
  customizing_item_id: id,
  customizing_item_name: name,
  customizing_item_type: type,
  customizing_item_tier_id: "Tier1",
  customizing_item_description: `${name}, as NEXON describes it.`,
  customizing_item_image_url: `${imageHost}${id}`,
  customizing_item_evolution_stage: [],
  available_descendant: descendants,
  ...extra,
});

const links = new Map([
  ["101000006", { slug: "bunny", name: "Bunny", ultimate: false }],
  [
    "101000019",
    { slug: "ultimate-bunny", name: "Ultimate Bunny", ultimate: true },
  ],
  ["101000016", { slug: "enzo", name: "Enzo", ultimate: false }],
  ["101000001", { slug: "lepic", name: "Lepic", ultimate: false }],
]);
const portraits = new Map([["bunny", `${imageHost}bunny`]]);

describe("the Cosmetics index", () => {
  it("makes one card per cosmetic, its versions in NEXON's id order", () => {
    const { cards } = cosmeticIndex(
      [
        record("282170136", "Dinosaur Pajamas", "CharacterBodySkin", [
          "101000016",
        ]),
        record("282170125", "Dinosaur Pajamas", "CharacterBodySkin", [
          "101000006",
          "101000019",
        ]),
        record("282070076", "Dinosaur Pajamas", "CharacterHeadSkin", [
          "101000006",
          "101000019",
        ]),
      ],
      links,
      portraits,
    );
    expect(cards.map((card) => card.slug)).toEqual([
      "dinosaur-pajamas-head-skin",
      "dinosaur-pajamas-body-skin",
    ]);
    expect(cards[1]?.versions.map((version) => version.id)).toEqual([
      "282170125",
      "282170136",
    ]);
    expect(cards[1]?.versions[0].descendants).toEqual([
      "bunny",
      "ultimate-bunny",
    ]);
    expect(cards[1]?.everyone).toBe(false);
  });

  it("keeps two cosmetics of one name and type apart when their text differs", () => {
    const { cards } = cosmeticIndex(
      [
        record("282600074", "Passion", "CharacterMakeupSkin", ["101000001"]),
        record("282600143", "Passion", "CharacterMakeupSkin", ["101000016"], {
          customizing_item_description: "Bright amber eyes.",
        }),
      ],
      links,
      portraits,
    );
    expect(cards.map((card) => card.slug)).toEqual([
      "passion-makeup",
      "passion-makeup-2",
    ]);
  });

  it("gives every Descendant the types T7SEN found every one can use", () => {
    const { cards } = cosmeticIndex(
      [
        record("283000001", "Small Aquarium", "CharacterBackAttachment", []),
        record("284100058", "Into the Dungeon", "CharacterSpawnSkin", []),
        // A head skin NEXON lists no one for is no one's.
        record("282000001", "Odd Hat", "CharacterHeadSkin", []),
      ],
      links,
      portraits,
    );
    expect(cards.map((card) => [card.name, card.everyone])).toEqual([
      ["Odd Hat", false],
      ["Small Aquarium", true],
      ["Into the Dungeon", true],
    ]);
  });

  it("keeps art, tierless ones and evolution stages in order", () => {
    const { cards } = cosmeticIndex(
      [
        record("282160001", "Speedy Awakened One", "CharacterBodySkin", [], {
          customizing_item_tier_id: null,
          customizing_item_image_url: null,
          customizing_item_evolution_stage: [
            { stage: 2, customizing_item_image_url: `${imageHost}two` },
            { stage: 1, customizing_item_image_url: `${imageHost}one` },
          ],
        }),
      ],
      links,
      portraits,
    );
    expect(cards[0]).toMatchObject({ tier: null });
    expect(cards[0]?.versions[0]).toMatchObject({
      imageUrl: null,
      stages: [`${imageHost}one`, `${imageHost}two`],
    });
  });

  it("names only the Descendants it knows, and lists those its cards name", () => {
    const { cards, descendants } = cosmeticIndex(
      [
        record("282070076", "Pajamas", "CharacterHeadSkin", [
          "101000019",
          "999",
          "101000006",
        ]),
      ],
      links,
      portraits,
    );
    expect(cards[0]?.versions[0].descendants).toEqual([
      "ultimate-bunny",
      "bunny",
    ]);
    expect(descendants).toEqual([
      { slug: "bunny", name: "Bunny", imageUrl: `${imageHost}bunny` },
      { slug: "ultimate-bunny", name: "Ultimate Bunny", imageUrl: "" },
    ]);
  });

  it("orders Descendants by name, each Ultimate after its base", () => {
    expect(
      cosmeticDescendantOrder([...links.values()], new Map()).map(
        (descendant) => descendant.name,
      ),
    ).toEqual(["Bunny", "Ultimate Bunny", "Enzo", "Lepic"]);
  });
});
