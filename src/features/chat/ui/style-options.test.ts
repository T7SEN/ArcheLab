import { describe, expect, it } from "vitest";
import { chatRegistry } from "./chat-registry";
import { filterGroups, styleGroups } from "./style-options";

const groups = styleGroups(chatRegistry);
const options = groups.flatMap((group) => group.options);
const byName = new Map(options.map((entry) => [entry.name, entry]));

describe("style picker options", () => {
  it("shows each look once: 44 colors, bold, italic and six sizes", () => {
    const colors = groups
      .filter((group) => group.id !== "text" && group.id !== "sizes")
      .flatMap((group) => group.options);
    expect(colors).toHaveLength(44);
    expect(groups.find((group) => group.id === "text")?.options).toHaveLength(
      2,
    );
    expect(groups.find((group) => group.id === "sizes")?.options).toHaveLength(
      6,
    );
  });

  it("covers every registry tag, under its shortest same-looking name", () => {
    const shown = new Set(
      options.flatMap((entry) => [entry.name, ...entry.sameAs]),
    );
    for (const tag of chatRegistry.data.tags) {
      expect(shown).toContain(tag.name);
    }
    expect(byName.get("Plain")?.sameAs).toEqual(["default", "QuestEvent"]);
    expect(byName.get("tier3")?.sameAs).toEqual(["UltimateCharacter"]);
    expect(byName.get("MetaGuide")?.sameAs).toEqual(["SkillElement"]);
  });

  it("groups colors by how they look, not where their names came from", () => {
    const names = (id: string): string[] =>
      groups
        .find((group) => group.id === id)
        ?.options.map((entry) => entry.name) ?? [];
    expect(groups.map((group) => group.title)).toEqual([
      "Colors",
      "Rarity",
      "Whites and grays",
      "Bold and italic",
      "Text sizes",
    ]);
    expect(names("colors")).toHaveLength(27);
    expect(names("colors")).toEqual(
      expect.arrayContaining(["red", "Camp", "QuestMain", "queststory"]),
    );
    expect(names("rarity")).toEqual(["tier1", "tier2", "tier3", "tier4"]);
    // Near-neutral colors join the grays, light to dark.
    const neutrals = names("neutrals");
    expect(neutrals[0]).toBe("Plain");
    expect(neutrals.at(-1)).toBe("Gray90");
    expect(neutrals).toEqual(expect.arrayContaining(["Glacier", "CharSkew"]));
  });

  it("sorts colors around the color wheel, reds first", () => {
    const colors = groups.find((group) => group.id === "colors")?.options ?? [];
    const position = (name: string): number =>
      colors.findIndex((entry) => entry.name === name);
    // enemy's hue is just under 360°, so it sorts with the reds.
    expect(position("enemy")).toBeLessThan(position("orange"));
    expect(position("orange")).toBeLessThan(position("yellow"));
    expect(position("yellow")).toBeLessThan(position("green"));
    expect(position("green")).toBeLessThan(position("blue"));
    expect(position("blue")).toBeLessThan(position("purple"));
    expect(colors.at(-1)?.name).toBe("queststory");
  });

  it("knows each style's cost and readability", () => {
    expect(byName.get("red")?.cost).toBe("<red></>".length);
    expect(byName.get("ChatSender_Big")?.cost).toBe(
      '<a id="ChatSender_Big"></>'.length,
    );
    expect(byName.get("red")?.lowContrast).toBe(true);
    expect(byName.get("blue")?.lowContrast).toBe(false);
    // The nine tags below WCAG AA in SPEC.md section 4.1.
    expect(
      options
        .filter((entry) => entry.lowContrast)
        .map((entry) => entry.name)
        .sort(),
    ).toEqual(
      [
        "red",
        "enemy",
        "Archive",
        "Blazer",
        "Gray70",
        "Gray80",
        "Gray90",
        "QuestSub",
        "QuestCommend",
      ].sort(),
    );
  });
});

describe("style search", () => {
  const names = (query: string): string[] =>
    filterGroups(groups, query).flatMap((group) =>
      group.options.map((entry) => entry.name),
    );

  it("keeps everything for an empty search", () => {
    expect(filterGroups(groups, "  ")).toEqual(groups);
  });

  it("matches labels, tag names and same-looking names, ignoring case", () => {
    expect(names("TIER4")).toEqual(["tier4"]);
    expect(names("transcendent")).toEqual(["tier4"]);
    // QuestEvent renders like Plain, so a search for it finds Plain.
    expect(names("questevent")).toEqual(["Plain"]);
  });

  it("matches a group title, showing the whole group", () => {
    expect(names("rarity")).toEqual(["tier1", "tier2", "tier3", "tier4"]);
  });

  it("drops groups with no match", () => {
    expect(filterGroups(groups, "zzz")).toEqual([]);
  });
});
