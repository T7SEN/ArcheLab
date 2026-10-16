import { describe, expect, it } from "vitest";
import { effectBlocks } from "./effect-blocks";

describe("effectBlocks", () => {
  it("keeps an effect of plain lines as one text block", () => {
    expect(
      effectBlocks("Multi-Hit Chance +20.6%[+]\nFire Rate +5.7%[x]"),
    ).toEqual([
      { kind: "text", text: "Multi-Hit Chance +20.6%[+]\nFire Rate +5.7%[x]" },
    ]);
  });

  it("reads a trigger module's sections as titled tables", () => {
    // Shaped like Arche Leak's level 0 effect (module.json, read 2026-10-16).
    expect(
      effectBlocks(
        "Basic Info\nCooldown\t15s\n\nArche Leak\nTime to Trigger\t30s\nSkill Cost\t(-20.00~-10.00)%[+]",
      ),
    ).toEqual([
      {
        kind: "table",
        title: "Basic Info",
        rows: [{ name: "Cooldown", value: "15s" }],
      },
      {
        kind: "table",
        title: "Arche Leak",
        rows: [
          { name: "Time to Trigger", value: "30s" },
          { name: "Skill Cost", value: "(-20.00~-10.00)%[+]" },
        ],
      },
    ]);
  });

  it("gives a section without a title line no title, and drops blank lines", () => {
    expect(effectBlocks("\nRange\tRadius 12m\n\n\n")).toEqual([
      {
        kind: "table",
        title: null,
        rows: [{ name: "Range", value: "Radius 12m" }],
      },
    ]);
  });
});
