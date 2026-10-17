import { CircuitBoard, Cpu, Crosshair, Hexagon, UserRound } from "lucide-react";
import { allPages, legalPages } from "@/data/site-pages";
import { tools } from "@/data/tools";
import type { PaletteCommand } from "./commands";
import type { PaletteModule } from "./palette-modules";

/** A Descendant the palette offers: picking it opens the Descendant's page. */
export interface PaletteDescendant {
  readonly name: string;
  /** The Descendant's page. */
  readonly href: string;
  readonly ultimate: boolean;
}

/** A weapon the palette offers: picking it opens the weapon's page. */
export interface PaletteWeapon {
  readonly name: string;
  /** The weapon's page. */
  readonly href: string;
  /** Its tier's rarity name, such as "Transcendent", shown beside it and searchable. */
  readonly tier: string;
  /** Its type, which a search also matches: "hand cannon" finds every Hand Cannon. */
  readonly type: string;
}

/** A reactor the palette offers: picking it opens its details on the reactors index. */
export interface PaletteReactor {
  readonly name: string;
  /** Its details: `/reactors?reactor=<slug>`. */
  readonly href: string;
  /** The attribute and Arche type it boosts, shown beside it and searchable. */
  readonly attribute: string | null;
  readonly archeType: string | null;
}

/**
 * An external component card the palette offers: picking it opens its details on the
 * external components index.
 */
export interface PaletteComponent {
  readonly name: string;
  /** Its details: `/external-components?component=<slug>`. */
  readonly href: string;
  /** Shown beside it: a set's tier, or how many tiers a component with no set has. */
  readonly hint: string;
  /** Its tiers and its pieces' names, which a search also matches. */
  readonly keywords: readonly string[];
}

const legalHrefs = new Set(legalPages.map((page) => page.href));

/** Every page, from the navbar's and the footer's lists. */
export function pageCommands(): PaletteCommand[] {
  return allPages.map((page) => ({
    id: `page:${page.href}`,
    label: page.label,
    group: "Pages",
    icon: page.icon,
    keywords: legalHrefs.has(page.href) ? ["legal"] : [],
    action: { kind: "go", href: page.href },
  }));
}

/** Every tool in the registry; the coming-soon ones show but can't be picked. */
export function toolCommands(): PaletteCommand[] {
  return tools.map((tool) => ({
    id: `tool:${tool.slug}`,
    label: tool.name,
    group: "Tools",
    icon: tool.icon,
    keywords: [tool.description],
    ...(tool.status === "live"
      ? { action: { kind: "go", href: tool.href } as const }
      : { hint: "Soon", disabled: true }),
  }));
}

/** Each Descendant, opening its page. */
export function descendantCommands(
  descendants: readonly PaletteDescendant[],
): PaletteCommand[] {
  return descendants.map((descendant) => ({
    id: `descendant:${descendant.href}`,
    label: descendant.name,
    group: "Descendants",
    icon: UserRound,
    keywords: ["descendant"],
    ...(descendant.ultimate ? { hint: "Ultimate" } : {}),
    action: { kind: "go", href: descendant.href },
  }));
}

/** Each weapon, opening its page (ADR 0024). */
export function weaponCommands(
  weapons: readonly PaletteWeapon[],
): PaletteCommand[] {
  return weapons.map((weapon) => ({
    id: `weapon:${weapon.href}`,
    label: weapon.name,
    group: "Weapons",
    icon: Crosshair,
    keywords: ["weapon", weapon.type, weapon.tier],
    hint: weapon.tier,
    action: { kind: "go", href: weapon.href },
  }));
}

/** Each module, opening its details on the modules index (ADR 0025). */
export function moduleCommands(
  modules: readonly PaletteModule[],
): PaletteCommand[] {
  return modules.map((module) => ({
    id: `module:${module.slug}`,
    label: module.name,
    group: "Modules",
    icon: Cpu,
    keywords: ["module", module.tier, ...module.keywords],
    hint: module.tier,
    action: { kind: "go", href: `/modules?module=${module.slug}` },
  }));
}

/** Each reactor, opening its details on the reactors index (ADR 0026). */
export function reactorCommands(
  reactors: readonly PaletteReactor[],
): PaletteCommand[] {
  return reactors.map((reactor) => {
    const types = [reactor.attribute, reactor.archeType].flatMap((type) =>
      type === null ? [] : [type],
    );
    return {
      id: `reactor:${reactor.href}`,
      label: reactor.name,
      group: "Reactors",
      icon: Hexagon,
      keywords: ["reactor", ...types],
      ...(types.length === 0 ? {} : { hint: types.join(" · ") }),
      action: { kind: "go", href: reactor.href },
    };
  });
}

/** Each external component card, opening its details on the index (ADR 0027). */
export function componentCommands(
  components: readonly PaletteComponent[],
): PaletteCommand[] {
  return components.map((component) => ({
    id: `component:${component.href}`,
    label: component.name,
    group: "External Components",
    icon: CircuitBoard,
    keywords: ["external component", ...component.keywords],
    hint: component.hint,
    action: { kind: "go", href: component.href },
  }));
}
