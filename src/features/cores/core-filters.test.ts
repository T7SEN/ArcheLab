import { describe, expect, it } from "vitest";
import type { CoreGrade } from "@/features/game-data/core-types";
import {
  componentGroups,
  coreFiltersToSearch,
  coreWeaponTypes,
  defaultCoreFilters,
  filterCores,
  parseCoreFilters,
  rollNames,
  shownVersions,
  shownWeapons,
  slotSummary,
  weaponsByType,
  type CoreKind,
  type CoreVersion,
  type CoreWeapon,
} from "./core-filters";

const art = "https://open.api.nexon.com/static/tfd/img/0";

/** One grade with options by name, as NEXON's `core-type.json` names them. */
const grade = (number: number, options: string[]): CoreGrade => ({
  grade: number,
  cores: [],
  options: options.map((name) => ({
    name,
    operator: "Multiply",
    min: 0.1,
    max: 0.2,
  })),
});

const version = (
  id: string,
  weaponTypes: string[],
  options: string[],
): CoreVersion => ({
  id,
  weaponTypes,
  grades: [grade(1, options), grade(10, options)],
});

const weapon = (name: string, type: string, slots: string[]): CoreWeapon => ({
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  type,
  slots,
});

const kind = (
  slot: string,
  equipment: CoreKind["equipment"],
  versions: CoreVersion[],
  weapons: CoreWeapon[] = [],
  sources: string[] = [],
): CoreKind => ({
  slug: slot.toLowerCase(),
  name: `${slot} Augmentation`,
  slot,
  equipment,
  imageUrl: art,
  versions,
  drops: [
    {
      grade: 10,
      items: [{ name: `${slot} Augmentation Core X`, imageUrl: art, sources }],
    },
  ],
  weapons,
  componentCards:
    equipment === "components"
      ? [
          {
            slug: "shell-crusher",
            name: "Shell Crusher",
            set: true,
            tier: "Ultimate",
          },
        ]
      : [],
});

const kinds = [
  kind(
    "Firepower",
    "weapons",
    [
      version(
        "382000101",
        ["Assault Rifle", "Hand Cannon"],
        ["Firearm ATK", "Additional Weapon ATK (vs. Colossus)"],
      ),
      version(
        "382000102",
        ["Launcher"],
        ["Explosive ATK", "Additional Weapon ATK (vs. Colossus)"],
      ),
    ],
    [
      weapon("Ancient Knight", "Assault Rifle", [
        "Free",
        "Firepower",
        "Firepower",
      ]),
      weapon("Thunder Cage", "Submachine Gun", ["Free", "Firepower"]),
      weapon("Sigvore's Proof", "Launcher", ["Free", "Free", "Firepower"]),
    ],
    ["[Void Erosion Purge] [Challenge] - [Stage 1]"],
  ),
  kind(
    "Hit",
    "weapons",
    [version("382000301", ["Assault Rifle"], ["Multi-Hit Chance"])],
    [weapon("Ancient Knight", "Assault Rifle", ["Free"])],
  ),
  kind(
    "Recovery",
    "components",
    [version("382010101", [], ["Max HP"])],
    [],
    ["[Axion Plains] Intercept Battle: [Wall Crasher] [Hard]"],
  ),
];

const offered = {
  weaponTypes: ["assault-rifle", "hand-cannon", "launcher"],
  kinds: kinds.map((entry) => entry.slug),
};
const shown = (search: string) =>
  filterCores(kinds, parseCoreFilters(search, offered)).map(
    (entry) => entry.slug,
  );

describe("the Cores index's filters", () => {
  it("read the URL query and ignore values the index doesn't offer", () => {
    expect(
      parseCoreFilters("?for=weapons&type=launcher&q=atk&core=hit", offered),
    ).toEqual({
      equipment: "weapons",
      weaponType: "launcher",
      query: "atk",
      open: "hit",
    });
    expect(
      parseCoreFilters("?for=vehicles&type=bow&core=free", offered),
    ).toEqual(defaultCoreFilters);
  });

  it("write only what isn't a default, and read it back", () => {
    expect(coreFiltersToSearch(defaultCoreFilters)).toBe("");
    const filters = {
      equipment: "components" as const,
      weaponType: null,
      query: "max hp",
      open: "recovery",
    };
    const search = coreFiltersToSearch(filters);
    expect(search).toBe("?for=components&q=max+hp&core=recovery");
    expect(parseCoreFilters(search, offered)).toEqual(filters);
  });

  it("show every card with no filter, in order", () => {
    expect(shown("")).toEqual(["firepower", "hit", "recovery"]);
  });

  it("keep weapon or external component cores", () => {
    expect(shown("?for=weapons")).toEqual(["firepower", "hit"]);
    expect(shown("?for=components")).toEqual(["recovery"]);
  });

  it("keep the cores a weapon type's slots take", () => {
    expect(shown("?type=launcher")).toEqual(["firepower"]);
    expect(shown("?type=assault-rifle")).toEqual(["firepower", "hit"]);
  });

  it("search names, rolls, weapons, components and drop places", () => {
    expect(shown("?q=explosive")).toEqual(["firepower"]);
    expect(shown("?q=thunder+cage")).toEqual(["firepower"]);
    expect(shown("?q=shell+crusher")).toEqual(["recovery"]);
    expect(shown("?q=launcher")).toEqual(["firepower"]);
    expect(shown("?q=wall+crasher")).toEqual(["recovery"]);
    expect(shown("?q=MULTI-HIT")).toEqual(["hit"]);
    expect(shown("?q=augmentation+core")).toEqual([
      "firepower",
      "hit",
      "recovery",
    ]);
  });

  it("search only the chosen weapon type's version", () => {
    expect(shown("?type=hand-cannon&q=explosive")).toEqual([]);
    expect(shown("?type=launcher&q=explosive")).toEqual(["firepower"]);
  });
});

describe("a core kind with a weapon type chosen", () => {
  const firepower = kinds.find((entry) => entry.slug === "firepower");
  if (firepower === undefined) {
    throw new Error("the fixture has Firepower");
  }

  it("shows that type's version, or every version without one", () => {
    expect(shownVersions(firepower, null)).toHaveLength(2);
    expect(
      shownVersions(firepower, "launcher").map((entry) => entry.id),
    ).toEqual(["382000102"]);
  });

  it("shows that type's weapons, or every weapon without one", () => {
    expect(shownWeapons(firepower, null)).toHaveLength(3);
    expect(
      shownWeapons(firepower, "assault-rifle").map((entry) => entry.name),
    ).toEqual(["Ancient Knight"]);
  });
});

describe("a core kind's words", () => {
  it("names each roll once, as the game writes it", () => {
    expect(rollNames(kinds[0]?.versions ?? [])).toEqual([
      "Firearm ATK",
      "Additional Weapon ATK (vs. Colossus)",
      "Explosive ATK",
    ]);
    expect(rollNames(kinds[1]?.versions ?? [])).toEqual([
      "Multi-Hit Chance(+)",
    ]);
  });

  it("counts a weapon's slots of one kind", () => {
    expect(slotSummary(["Free", "Firepower", "Firepower"])).toBe(
      "Free, Firepower ×2",
    );
    expect(slotSummary(["Free", "Free", "Firepower"])).toBe(
      "Free ×2, Firepower",
    );
    expect(slotSummary(["Hit"])).toBe("Hit");
  });

  it("puts set cards apart from those with no set effect", () => {
    const card = (name: string, set: boolean) => ({
      slug: name.toLowerCase().replace(/W+/g, "-"),
      name,
      set,
      tier: "Ultimate",
    });
    expect(
      componentGroups([
        card("Active Volcano", true),
        card("DEF Support", false),
        card("Shell Crusher", true),
      ]).map((group) => [group.title, group.cards.map((entry) => entry.name)]),
    ).toEqual([
      ["Sets", ["Active Volcano", "Shell Crusher"]],
      ["Components with no set", ["DEF Support"]],
    ]);
    expect(componentGroups([card("HP Support", false)])).toHaveLength(1);
    expect(componentGroups([])).toEqual([]);
  });

  it("groups weapons by type in the order they come", () => {
    expect(
      weaponsByType(kinds[0]?.weapons ?? []).map((group) => [
        group.type,
        group.weapons.length,
      ]),
    ).toEqual([
      ["Assault Rifle", 1],
      ["Submachine Gun", 1],
      ["Launcher", 1],
    ]);
  });

  it("lists every weapon type the versions name, A–Z", () => {
    expect(coreWeaponTypes(kinds)).toEqual([
      "Assault Rifle",
      "Hand Cannon",
      "Launcher",
    ]);
  });
});
