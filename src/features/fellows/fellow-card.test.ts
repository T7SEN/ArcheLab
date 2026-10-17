import { describe, expect, it } from "vitest";
import {
  fellowNumbersAt,
  fellowSearch,
  openFellow,
  type FellowCard,
} from "./fellow-card";

const slugs = ["hagios-sheepdog", "snowy-sled-dog"];

describe("the open Fellow in the URL", () => {
  it("opens a Fellow the page has", () => {
    expect(openFellow("?fellow=snowy-sled-dog", slugs)).toBe("snowy-sled-dog");
  });

  it("opens nothing for an unknown or missing Fellow", () => {
    expect(openFellow("?fellow=bunny", slugs)).toBeNull();
    expect(openFellow("", slugs)).toBeNull();
    expect(openFellow("?reactor=hagios-sheepdog", slugs)).toBeNull();
  });

  it("writes the query back", () => {
    expect(fellowSearch("hagios-sheepdog")).toBe("?fellow=hagios-sheepdog");
    expect(fellowSearch(null)).toBe("");
  });
});

describe("a Fellow's numbers at a level", () => {
  const card: FellowCard = {
    slug: "snowy-sled-dog",
    name: "Snowy Sled Dog",
    tierName: "Normal",
    hex: "#53b7f7",
    imageUrl: null,
    passive: "mp",
    levels: [
      {
        level: 40,
        stats: [{ name: "Module Drop Rate Increase Modifier", value: 0.25 }],
      },
      { level: 41, stats: [] },
    ],
    effect: null,
    research: null,
  };

  it("joins NEXON's stats and the notes' cycle and passive", () => {
    expect(fellowNumbersAt(card, 40)).toEqual([
      { name: "Module Drop Rate Increase Modifier", value: "25%" },
      { name: "Auto-Dismantle Cycle", value: "60s" },
      { name: "Auto MP Recovery Interval", value: "15s" },
      { name: "MP Recovery Ratio", value: "23%" },
    ]);
  });

  it("shows only NEXON's at a level the notes don't have", () => {
    expect(fellowNumbersAt(card, 41)).toEqual([]);
  });
});
