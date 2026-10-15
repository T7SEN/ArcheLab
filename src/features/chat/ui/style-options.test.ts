import { describe, expect, it } from "vitest";
import { chatRegistry } from "./chat-registry";
import { styleGroups } from "./style-options";

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

  it("groups colors, keeping white with the common colors", () => {
    const names = (id: string): string[] =>
      groups
        .find((group) => group.id === id)
        ?.options.map((entry) => entry.name) ?? [];
    expect(names("common")).toContain("Plain");
    expect(names("rarity")).toEqual(["tier1", "tier2", "tier3", "tier4"]);
    expect(names("grays")).toHaveLength(9);
    expect(names("quest")).not.toContain("queststory");
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
