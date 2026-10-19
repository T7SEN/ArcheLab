import { describe, expect, it } from "vitest";
import { groupPlaces, isWideBox, splitPlace, withPlaceLinks } from "./places";

describe("groupPlaces", () => {
  it("groups places by what comes before ' - ', merging one place's ways", () => {
    expect(
      groupPlaces([
        "[Kingston] [Hard] - [Magister Lab] Support Complete",
        "[Kingston] [Hard] - [Magister Lab] complete",
        "[Kingston] [Hard] - [Slumber Valley] complete",
        "[Vespers] [Normal] - [Sepulcher] Mission Monster",
      ]),
    ).toEqual([
      {
        title: "[Kingston] [Hard]",
        places: [
          { name: "[Magister Lab]", ways: ["Support Complete", "complete"] },
          { name: "[Slumber Valley]", ways: ["complete"] },
        ],
      },
      {
        title: "[Vespers] [Normal]",
        places: [{ name: "[Sepulcher]", ways: ["Mission Monster"] }],
      },
    ]);
  });

  it("keeps a ' - ' or ': ' inside brackets as part of the name", () => {
    expect(
      groupPlaces([
        "[Trials - Protocol 001] Mission Monster",
        "[Amorphous Material Pattern: Bunny] required",
        "[Kingston] [Hard] - [Void Fusion Reactor - Kingston Grand Square] Mission Monster",
      ]),
    ).toEqual([
      {
        title: "[Kingston] [Hard]",
        places: [
          {
            name: "[Void Fusion Reactor - Kingston Grand Square]",
            ways: ["Mission Monster"],
          },
        ],
      },
      {
        title: null,
        places: [
          { name: "[Trials - Protocol 001]", ways: ["Mission Monster"] },
          { name: "[Amorphous Material Pattern: Bunny]", ways: ["required"] },
        ],
      },
    ]);
  });

  it("groups by ': ' when there is no ' - ', and puts untitled places last", () => {
    expect(
      groupPlaces([
        "Obtainable through Research",
        "Intercept Battle: [Extreme] [Gluttony]",
        "Intercept Battle: [Extreme] [Molten Fortress]",
      ]),
    ).toEqual([
      {
        title: "Intercept Battle",
        places: [
          { name: "[Extreme] [Gluttony]", ways: [] },
          { name: "[Extreme] [Molten Fortress]", ways: [] },
        ],
      },
      {
        title: null,
        places: [{ name: "Obtainable through Research", ways: [] }],
      },
    ]);
  });

  it("gives nothing for no places", () => {
    expect(groupPlaces([])).toEqual([]);
  });
});

describe("isWideBox", () => {
  it("widens a long box holding most of the lines", () => {
    expect(isWideBox(28, 31)).toBe(true);
    expect(isWideBox(12, 12)).toBe(true);
  });

  it("keeps short boxes, and long ones among many others, in their column", () => {
    expect(isWideBox(3, 31)).toBe(false);
    expect(isWideBox(7, 7)).toBe(false);
    expect(isWideBox(21, 70)).toBe(false);
  });
});

describe("splitPlace", () => {
  it("splits a name into its box's title, the place and the way", () => {
    expect(splitPlace("[Vespers] [Hard] - [Sepulcher] complete")).toEqual({
      title: "[Vespers] [Hard]",
      place: "[Sepulcher]",
      way: "complete",
    });
    expect(splitPlace("Intercept Battle: [Extreme] [Gluttony]")).toEqual({
      title: "Intercept Battle",
      place: "[Extreme] [Gluttony]",
      way: "",
    });
    expect(splitPlace("[Trials - Protocol 001]")).toEqual({
      title: null,
      place: "[Trials - Protocol 001]",
      way: "",
    });
  });
});

describe("withPlaceLinks", () => {
  const names = new Map([
    [
      "MS:DungeonField:620130100:Hard_400",
      "[Vespers] [Hard] - [The Shelter] complete",
    ],
    [
      "MS:DungeonField:620120107:Hard",
      "[Vespers] [Hard] - [The Shelter] complete",
    ],
    [
      "MM:BaseMission:620101001:Hard",
      "[Kingston] [Hard] - [Urban District] Mission Monster",
    ],
  ]);
  const hrefs = new Map([
    [
      "MS:DungeonField:620130100:Hard_400",
      "/infiltration-400?operation=the-shelter",
    ],
  ]);

  it("links a place's name when any id that names it has a page", () => {
    expect(
      withPlaceLinks(
        [
          "MS:DungeonField:620120107:Hard",
          "MS:DungeonField:620130100:Hard_400",
        ],
        names,
        hrefs,
      ),
    ).toEqual({
      placeLinks: {
        "[Vespers] [Hard] - [The Shelter] complete":
          "/infiltration-400?operation=the-shelter",
      },
    });
  });

  it("adds nothing when no place links, so items keep their shape", () => {
    expect(
      withPlaceLinks(["MS:DungeonField:620120107:Hard"], names, hrefs),
    ).toEqual({});
    expect(withPlaceLinks(["MM:BaseMission:620101001:Hard"], names)).toEqual(
      {},
    );
    expect(
      withPlaceLinks(["unknown"], names, new Map([["unknown", "/x"]])),
    ).toEqual({});
  });
});
