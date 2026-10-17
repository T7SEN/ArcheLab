import { describe, expect, it } from "vitest";
import {
  matchesCommand,
  paletteGroups,
  type PaletteCommand,
  type PaletteSource,
} from "./commands";
import { paletteComponents } from "./palette-components";
import { paletteDescendants } from "./palette-descendants";
import { readModuleList } from "./palette-modules";
import { paletteWeapons } from "./palette-weapons";
import {
  componentCommands,
  descendantCommands,
  moduleCommands,
  pageCommands,
  reactorCommands,
  toolCommands,
  weaponCommands,
} from "./site-commands";
import { allPages } from "@/data/site-pages";
import { tools } from "@/data/tools";

const command = (overrides: Partial<PaletteCommand>): PaletteCommand => ({
  id: "x",
  label: "Privacy policy",
  group: "Pages",
  ...overrides,
});

describe("matchesCommand", () => {
  it("matches everything when the query is empty or blank", () => {
    expect(matchesCommand(command({}), "")).toBe(true);
    expect(matchesCommand(command({}), "   ")).toBe(true);
  });

  it("needs every word, in any order, from the label, group or keywords", () => {
    const privacy = command({ keywords: ["legal"] });
    expect(matchesCommand(privacy, "PRIVACY")).toBe(true);
    expect(matchesCommand(privacy, "legal priv")).toBe(true);
    expect(matchesCommand(privacy, "pages policy")).toBe(true);
    expect(matchesCommand(privacy, "privacy terms")).toBe(false);
  });
});

describe("paletteGroups", () => {
  const source = (
    id: string,
    order: number,
    commands: PaletteCommand[],
    hides?: string[],
  ): PaletteSource => ({ id, order, commands: () => commands, hides });

  it("lists sources by order and groups commands where each group first appears", () => {
    const groups = paletteGroups([
      source("b", 20, [command({ id: "b1", group: "Tools" })]),
      source("a", 10, [
        command({ id: "a1", group: "Pages" }),
        command({ id: "a2", group: "Tools" }),
      ]),
    ]);
    expect(
      groups.map((group) => [group.value, group.items.map((item) => item.id)]),
    ).toEqual([
      ["Pages", ["a1"]],
      ["Tools", ["a2", "b1"]],
    ]);
  });

  it("leaves out the sources another one hides", () => {
    const groups = paletteGroups([
      source("descendants", 30, [command({ group: "Descendants" })]),
      source("chat", 40, [command({ group: "Icons" })], ["descendants"]),
    ]);
    expect(groups.map((group) => group.value)).toEqual(["Icons"]);
  });

  it("puts the commands that can't be picked last in their group", () => {
    const groups = paletteGroups([
      source("chat", 0, [
        command({ id: "copy", group: "Chat", disabled: true }),
        command({ id: "clear", group: "Chat", disabled: true }),
        command({ id: "templates", group: "Chat" }),
        command({ id: "party", group: "Chat" }),
      ]),
    ]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      "templates",
      "party",
      "copy",
      "clear",
    ]);
  });

  it("reads each source's commands again every time", () => {
    let label = "Before";
    const live = source("live", 0, []);
    const changing: PaletteSource = {
      ...live,
      commands: () => [command({ label })],
    };
    expect(paletteGroups([changing])[0]?.items[0]?.label).toBe("Before");
    label = "After";
    expect(paletteGroups([changing])[0]?.items[0]?.label).toBe("After");
  });
});

describe("the site's commands", () => {
  it("offer every page, with the legal pages findable as legal", () => {
    const pages = pageCommands();
    expect(pages.map((page) => page.action)).toEqual(
      allPages.map((page) => ({ kind: "go", href: page.href })),
    );
    const terms = pages.find((page) => page.label === "Terms of use");
    expect(terms && matchesCommand(terms, "legal")).toBe(true);
  });

  it("offer every tool, with coming-soon tools shown but not pickable", () => {
    const commands = toolCommands();
    expect(commands).toHaveLength(tools.length);
    for (const tool of tools) {
      const entry = commands.find((item) => item.label === tool.name);
      if (tool.status === "live") {
        expect(entry?.action).toEqual({ kind: "go", href: tool.href });
      } else {
        expect(entry).toMatchObject({ disabled: true, hint: "Soon" });
        expect(entry?.action).toBeUndefined();
      }
    }
  });

  it("offer each Descendant A–Z, opening its page", () => {
    const descendants = paletteDescendants([
      { slug: "ultimate-bunny", name: "Ultimate Bunny", ultimate: true },
      { slug: "raven", name: "Raven", ultimate: false },
      { slug: "bunny", name: "Bunny", ultimate: false },
    ]);
    expect(descendants).toEqual([
      { name: "Bunny", href: "/descendants/bunny", ultimate: false },
      { name: "Raven", href: "/descendants/raven", ultimate: false },
      {
        name: "Ultimate Bunny",
        href: "/descendants/ultimate-bunny",
        ultimate: true,
      },
    ]);

    const commands = descendantCommands(descendants);
    expect(commands).toHaveLength(descendants.length);
    expect(
      commands.find((entry) => entry.label === "Ultimate Bunny")?.hint,
    ).toBe("Ultimate");
    expect(commands.every((entry) => matchesCommand(entry, "descendant"))).toBe(
      true,
    );
  });

  it("offer each weapon A–Z with its tier, opening its page and found by type", () => {
    const weapons = paletteWeapons([
      {
        slug: "thunder-cage",
        name: "Thunder Cage",
        imageUrl: "",
        tier: "Tier3",
        type: "Hand Cannon",
        rounds: "Impact Rounds",
      },
      {
        slug: "monster-hunter",
        name: "Monster Hunter",
        imageUrl: "",
        tier: "Tier4",
        type: "Assault Rifle",
        rounds: "General Rounds",
      },
    ]);
    expect(weapons).toEqual([
      {
        name: "Monster Hunter",
        href: "/weapons/monster-hunter",
        tier: "Transcendent",
        type: "Assault Rifle",
      },
      {
        name: "Thunder Cage",
        href: "/weapons/thunder-cage",
        tier: "Ultimate",
        type: "Hand Cannon",
      },
    ]);

    const commands = weaponCommands(weapons);
    expect(commands.at(0)).toMatchObject({
      label: "Monster Hunter",
      group: "Weapons",
      hint: "Transcendent",
      action: { kind: "go", href: "/weapons/monster-hunter" },
    });
    expect(
      commands.filter((entry) => matchesCommand(entry, "hand cannon")),
    ).toHaveLength(1);
  });

  it("offer each module with its tier, opening its details and found by type", () => {
    const modules = readModuleList({
      modules: [
        {
          slug: "multi-trigger-rifling",
          name: "Multi-Trigger Rifling",
          tier: "Rare",
          keywords: ["General Rounds", "Multi-Hit Chance"],
        },
      ],
    });
    expect(modules).not.toBeNull();
    const commands = moduleCommands(modules ?? []);
    expect(commands.at(0)).toMatchObject({
      label: "Multi-Trigger Rifling",
      group: "Modules",
      hint: "Rare",
      action: { kind: "go", href: "/modules?module=multi-trigger-rifling" },
    });
    expect(
      commands.filter((entry) => matchesCommand(entry, "multi-hit chance")),
    ).toHaveLength(1);
  });

  it("ignore a module list that isn't one", () => {
    expect(readModuleList(null)).toBeNull();
    expect(readModuleList({ modules: [{ slug: "x" }] })).toBeNull();
    expect(readModuleList({ modules: [] })).toEqual([]);
  });

  it("offer each reactor with its attribute and Arche type, found by either", () => {
    const commands = reactorCommands([
      {
        name: "Burning Phase Reactor",
        href: "/reactors?reactor=burning-phase-reactor",
        attribute: "Fire",
        archeType: "Dimension",
      },
    ]);
    expect(commands.at(0)).toMatchObject({
      label: "Burning Phase Reactor",
      group: "Reactors",
      hint: "Fire · Dimension",
      action: { kind: "go", href: "/reactors?reactor=burning-phase-reactor" },
    });
    expect(
      commands.filter((entry) => matchesCommand(entry, "fire dimension")),
    ).toHaveLength(1);
  });

  it("offer each external component card with its tier, found by its pieces' names", () => {
    const piece = (name: string, slot: string, tier: string) => ({
      id: name,
      name,
      slot,
      tier,
      imageUrl: "https://open.api.nexon.com/static/tfd/img/x",
      stat: "Max HP",
      coreSlots: 0,
      levels: [],
    });
    const components = paletteComponents([
      {
        slug: "hp-support",
        name: "HP Support",
        kind: "standalone",
        bonuses: [],
        pieces: [
          piece("HP Support Sensor", "Sensor", "Tier3"),
          piece("HP Support Sensor", "Sensor", "Tier2"),
        ],
      },
      {
        slug: "active-volcano",
        name: "Active Volcano",
        kind: "set",
        bonuses: [{ count: 2, effect: "Two." }],
        pieces: [
          piece("Volcanic Sensor", "Sensor", "Tier3"),
          piece("Volcanic Memory", "Memory", "Tier3"),
        ],
      },
    ]);
    expect(components).toEqual([
      {
        name: "Active Volcano",
        href: "/external-components?component=active-volcano",
        hint: "Ultimate",
        keywords: ["Ultimate", "Volcanic"],
      },
      {
        name: "HP Support",
        href: "/external-components?component=hp-support",
        hint: "2 tiers",
        keywords: ["Ultimate", "Rare"],
      },
    ]);
    const commands = componentCommands(components);
    expect(commands.at(0)).toMatchObject({
      label: "Active Volcano",
      group: "External Components",
      action: {
        kind: "go",
        href: "/external-components?component=active-volcano",
      },
    });
    expect(
      commands
        .filter((entry) => matchesCommand(entry, "volcanic"))
        .map((entry) => entry.label),
    ).toEqual(["Active Volcano"]);
    expect(
      commands.filter((entry) => matchesCommand(entry, "external component")),
    ).toHaveLength(2);
  });
});
