import { describe, expect, it } from "vitest";
import {
  matchesCommand,
  paletteGroups,
  type PaletteCommand,
  type PaletteSource,
} from "./commands";
import { paletteComponents } from "./palette-components";
import { paletteDescendants } from "./palette-descendants";
import { paletteFellows } from "./palette-fellows";
import { paletteMutantCells } from "./palette-mutant-cells";
import { paletteVehicles } from "./palette-vehicles";
import { readModuleList } from "./palette-modules";
import { paletteWeapons } from "./palette-weapons";
import {
  componentCommands,
  descendantCommands,
  fellowCommands,
  moduleCommands,
  mutantCellCommands,
  pageCommands,
  reactorCommands,
  toolCommands,
  vehicleCommands,
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

describe("Fellows in the palette", () => {
  it("opens each Fellow's details, with its tier and passive beside it", () => {
    const fellow = (id: string, name: string) => ({
      id,
      slug: name.toLowerCase().replaceAll(" ", "-"),
      name,
      tier: "Tier1",
      levels: [],
      research: null,
    });
    const fellows = paletteFellows([
      fellow("107200003", "Snowy Sled Dog"),
      fellow("107200001", "Hagios Sheepdog"),
    ]);
    expect(fellows).toEqual([
      {
        name: "Hagios Sheepdog",
        href: "/fellows?fellow=hagios-sheepdog",
        tier: "Normal",
        passive: "Auto HP Recovery",
      },
      {
        name: "Snowy Sled Dog",
        href: "/fellows?fellow=snowy-sled-dog",
        tier: "Normal",
        passive: "Auto MP Recovery",
      },
    ]);
    const commands = fellowCommands(fellows);
    expect(commands.at(0)).toMatchObject({
      label: "Hagios Sheepdog",
      group: "Fellows",
      hint: "Normal · Auto HP Recovery",
      action: { kind: "go", href: "/fellows?fellow=hagios-sheepdog" },
    });
    expect(
      commands
        .filter((entry) => matchesCommand(entry, "mp recovery"))
        .map((entry) => entry.label),
    ).toEqual(["Snowy Sled Dog"]);
    expect(
      commands.filter((entry) => matchesCommand(entry, "fellow")),
    ).toHaveLength(2);
  });
});

describe("vehicles in the palette", () => {
  it("opens each vehicle's details, with its tier and kind beside it", () => {
    const vehicle = (id: string, name: string, kind: string) => ({
      id,
      slug: name.toLowerCase(),
      name,
      description: `${kind}, ${name}`,
      tier: "Tier2",
      imageUrl: "https://open.api.nexon.com/static/tfd/img/x",
      stats: [],
      levels: [],
      research: null,
    });
    const vehicles = paletteVehicles([
      vehicle("107300003", "Orca", "Balanced Hover Bike"),
      vehicle("107300002", "Vortex", "Speed Hover Bike"),
    ]);
    expect(vehicles).toEqual([
      {
        name: "Orca",
        href: "/vehicles?vehicle=orca",
        hint: "Rare · Balanced Hover Bike",
      },
      {
        name: "Vortex",
        href: "/vehicles?vehicle=vortex",
        hint: "Rare · Speed Hover Bike",
      },
    ]);
    const commands = vehicleCommands(vehicles);
    expect(commands.at(1)).toMatchObject({
      label: "Vortex",
      group: "Vehicles",
      action: { kind: "go", href: "/vehicles?vehicle=vortex" },
    });
    expect(
      commands
        .filter((entry) => matchesCommand(entry, "speed hover"))
        .map((entry) => entry.label),
    ).toEqual(["Vortex"]);
  });
});

describe("Mutant Cells in the palette", () => {
  it("opens each cell's details, A–Z, with its socket beside it", () => {
    const cell = (name: string, socket: "Almandine" | "Xantic") => ({
      name,
      socket,
      description: "",
      effects: [],
      added: "1.3.9" as const,
    });
    const cells = paletteMutantCells([
      cell("Venomous Spike", "Xantic"),
      cell("Activate Thrust", "Almandine"),
    ]);
    expect(cells).toEqual([
      {
        name: "Activate Thrust",
        href: "/mutant-cells?cell=activate-thrust",
        socket: "Almandine",
      },
      {
        name: "Venomous Spike",
        href: "/mutant-cells?cell=venomous-spike",
        socket: "Xantic",
      },
    ]);
    const commands = mutantCellCommands(cells);
    expect(commands.at(1)).toMatchObject({
      label: "Venomous Spike",
      group: "Mutant Cells",
      hint: "Xantic",
      action: { kind: "go", href: "/mutant-cells?cell=venomous-spike" },
    });
    // A socket finds its cells.
    expect(
      commands
        .filter((entry) => matchesCommand(entry, "almandine"))
        .map((entry) => entry.label),
    ).toEqual(["Activate Thrust"]);
  });
});
