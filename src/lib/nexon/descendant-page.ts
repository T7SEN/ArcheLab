import "server-only";
import { z } from "zod";
import { extraArcheTypes } from "@/data/arche-types";
import { slugOf } from "@/lib/slug";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";
import { recipeFor, researchFor, type Recipe } from "./recipe";
import {
  fetchMaterials,
  fetchModules,
  fetchResearch,
  fetchStats,
  numericId,
  type MaterialRecord,
  type ModuleRecord,
  type ResearchRecord,
  type StatRecord,
} from "./shared-sets";

/**
 * A Descendant's page (ADR 0023): stats at every level, skills, exclusive modules and
 * the research recipe, all from NEXON's metadata. Each schema reads only the fields the
 * page uses; an entry that fails is left out, so a NEXON change hides what it breaks.
 */

const id = numericId;

const descendantSchema = z.object({
  descendant_id: id,
  descendant_name: z.string().min(1),
  descendant_group_id: id,
  descendant_image_url: nexonImageUrl,
  descendant_stat: z.array(
    z.object({
      level: z.number().int().positive(),
      stat_detail: z.array(z.object({ stat_id: id, stat_value: z.number() })),
    }),
  ),
  descendant_skill: z.array(
    z.object({
      skill_type: z.string().min(1),
      skill_name: z.string().min(1),
      element_type: z.string().min(1).nullable(),
      arche_type: z.string().min(1).nullable(),
      skill_image_url: nexonImageUrl,
      skill_description: z.string(),
    }),
  ),
});

export type DescendantRecord = z.infer<typeof descendantSchema>;

/** The NEXON sets a Descendant's page reads. */
export interface DescendantSets {
  readonly descendants: readonly DescendantRecord[];
  readonly stats: readonly StatRecord[];
  readonly modules: readonly ModuleRecord[];
  readonly research: readonly ResearchRecord[];
  readonly materials: readonly MaterialRecord[];
}

export interface DescendantStat {
  readonly name: string;
  /** One value per entry of `DescendantPage.levels`. */
  readonly values: readonly number[];
  /**
   * On an Ultimate's page, its base Descendant's value at the same levels, for the
   * difference; null on a base page or when the base lacks the stat.
   */
  readonly baseValues: readonly number[] | null;
}

export interface DescendantSkill {
  /** "Active Skill" or "Passive Skill", as NEXON names it. */
  readonly type: string;
  readonly name: string;
  readonly element: string | null;
  readonly archeType: string | null;
  readonly imageUrl: string;
  readonly description: string;
}

export interface DescendantModule {
  readonly name: string;
  readonly imageUrl: string;
  /** NEXON's tier id, such as "Tier4"; the chat registry names its rarity. */
  readonly tier: string;
  /** NEXON's module type, such as "Ancestors", or null. */
  readonly type: string | null;
  readonly socket: string | null;
  readonly slots: readonly string[];
  /** Capacity at the lowest and the highest level NEXON lists, or null for none. */
  readonly capacity: {
    readonly from: { readonly level: number; readonly value: number };
    readonly to: { readonly level: number; readonly value: number };
  } | null;
  /** The effect text at the highest level, or null when NEXON gives none. */
  readonly effect: string | null;
  /**
   * A Transcendent module: `Tier4` and not an Ancestor module. Only one is equipped at
   * a time, so the page lets players pick one and see what it changes.
   */
  readonly transcendent: boolean;
  /** The Descendant's skills its effect names, in skill order. */
  readonly changesSkills: readonly string[];
  /** On an Ultimate's page: a module its base Descendant cannot equip. */
  readonly ultimateOnly: boolean;
}

/** A link to a Descendant's page. */
export interface DescendantLink {
  readonly slug: string;
  readonly name: string;
  /** Named "Ultimate …" in NEXON's data. */
  readonly ultimate: boolean;
}

/** A Descendant as lists show it: the index, the palette and page neighbors. */
export interface DescendantSummary extends DescendantLink {
  readonly imageUrl: string;
  /** The skills' attributes, each once; every Descendant has one (2026-10-16). */
  readonly elements: readonly string[];
  /**
   * The skills' Arche types, each once, then any T7SEN found in game that NEXON leaves
   * out (`arche-types.ts`); most Descendants mix several.
   */
  readonly archeTypes: readonly string[];
}

export interface DescendantPage {
  readonly slug: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly ultimate: boolean;
  /**
   * A base Descendant and its Ultimate, which share a `descendant_group_id`, base
   * first; null when the Descendant has no Ultimate.
   */
  readonly pair: readonly [DescendantLink, DescendantLink] | null;
  /** On an Ultimate's page, its base Descendant's name; the stats compare with it. */
  readonly baseName: string | null;
  /** The Descendants before and after it in NEXON's order (newest first). */
  readonly previous: DescendantLink | null;
  readonly next: DescendantLink | null;
  /** The levels NEXON lists stats for, lowest first. */
  readonly levels: readonly number[];
  readonly stats: readonly DescendantStat[];
  readonly skills: readonly DescendantSkill[];
  /**
   * The skills' attributes and Arche types, each once, in skill order; Arche types NEXON
   * leaves out follow (`arche-types.ts`).
   */
  readonly elements: readonly string[];
  readonly archeTypes: readonly string[];
  readonly modules: readonly DescendantModule[];
  readonly research: Recipe | null;
}

/** A page address from a name: "Ultimate Bunny" is `ultimate-bunny`. */
export function descendantSlug(name: string): string {
  return slugOf(name);
}

function unique(values: readonly (string | null)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => value !== null)),
  ];
}

const ultimatePrefix = "Ultimate ";

function isUltimate(name: string): boolean {
  return name.startsWith(ultimatePrefix);
}

function linkTo(entry: DescendantRecord): DescendantLink {
  return {
    slug: descendantSlug(entry.descendant_name),
    name: entry.descendant_name,
    ultimate: isUltimate(entry.descendant_name),
  };
}

/** The skills' Arche types, each once, then any T7SEN found in game that NEXON leaves out. */
function archeTypesOf(entry: DescendantRecord): string[] {
  return unique([
    ...entry.descendant_skill.map((skill) => skill.arche_type),
    ...(extraArcheTypes.get(entry.descendant_name) ?? []),
  ]);
}

/**
 * Every Descendant in NEXON's order: newest first, as the home carousel shows them.
 * NEXON's ids rise with each release (checked 2026-10-16, ADR 0018).
 */
export function descendantSummaries(
  descendants: readonly DescendantRecord[],
): DescendantSummary[] {
  return [...descendants]
    .sort((a, b) => Number(b.descendant_id) - Number(a.descendant_id))
    .map((entry) => ({
      ...linkTo(entry),
      imageUrl: entry.descendant_image_url,
      elements: unique(
        entry.descendant_skill.map((skill) => skill.element_type),
      ),
      archeTypes: archeTypesOf(entry),
    }));
}

/**
 * A Descendant's stats by name, one value per level in `levels`, in its own order
 * (HP, Shield, MP, DEF, …), not stat.json's global order, which puts MP first. A stat
 * without a name in stat.json, or missing at one of the levels, is left out.
 */
function statsOf(
  entry: DescendantRecord,
  levels: readonly number[],
  statNames: ReadonlyMap<string, string>,
): Map<string, number[]> {
  const byLevel = new Map(
    entry.descendant_stat.map((level) => [level.level, level.stat_detail]),
  );
  const statIds = unique(
    [...entry.descendant_stat]
      .sort((a, b) => a.level - b.level)
      .flatMap((level) => level.stat_detail.map((detail) => detail.stat_id)),
  );
  const stats = new Map<string, number[]>();
  for (const statId of statIds) {
    const name = statNames.get(statId);
    const values = levels.map(
      (level) =>
        byLevel.get(level)?.find((detail) => detail.stat_id === statId)
          ?.stat_value,
    );
    if (name !== undefined && values.every((value) => value !== undefined)) {
      stats.set(name, values);
    }
  }
  return stats;
}

/** A Descendant's page from NEXON's sets, or null when NEXON lists no such Descendant. */
export function descendantPageFrom(
  sets: DescendantSets,
  slug: string,
): DescendantPage | null {
  const entry = sets.descendants.find(
    (descendant) => descendantSlug(descendant.descendant_name) === slug,
  );
  if (entry === undefined) {
    return null;
  }
  const levels = [...entry.descendant_stat]
    .map((level) => level.level)
    .sort((a, b) => a - b);
  const statNames = new Map(
    sets.stats.map((stat) => [stat.stat_id, stat.stat_name]),
  );
  const ultimate = isUltimate(entry.descendant_name);
  // An Ultimate pairs with the base Descendant of its group: same skills, higher stats,
  // more modules (ADR 0023).
  const groupMates = sets.descendants.filter(
    (descendant) =>
      descendant.descendant_group_id === entry.descendant_group_id,
  );
  const base = groupMates.find(
    (descendant) => !isUltimate(descendant.descendant_name),
  );
  const ultimateMate = groupMates.find((descendant) =>
    isUltimate(descendant.descendant_name),
  );
  const baseStats =
    ultimate && base !== undefined ? statsOf(base, levels, statNames) : null;
  const stats = [...statsOf(entry, levels, statNames)].map(
    ([name, values]): DescendantStat => ({
      name,
      values,
      baseValues: baseStats?.get(name) ?? null,
    }),
  );
  const modules = sets.modules
    .filter((module) =>
      module.available_descendant_id.includes(entry.descendant_id),
    )
    .flatMap((module): DescendantModule[] => {
      const byLevel = [...module.module_stat].sort((a, b) => a.level - b.level);
      const first = byLevel.at(0);
      const last = byLevel.at(-1);
      if (first === undefined || last === undefined) {
        return [];
      }
      const effect = last.value;
      return [
        {
          name: module.module_name,
          imageUrl: module.image_url,
          tier: module.module_tier_id,
          type: module.module_type,
          socket: module.module_socket_type,
          slots: module.available_module_slot_type,
          capacity:
            first.module_capacity === null || last.module_capacity === null
              ? null
              : {
                  from: { level: first.level, value: first.module_capacity },
                  to: { level: last.level, value: last.module_capacity },
                },
          effect,
          transcendent:
            module.module_tier_id === "Tier4" &&
            module.module_type !== "Ancestors",
          // Only what the effect text names: NEXON gives no changed skill text.
          changesSkills:
            effect === null
              ? []
              : entry.descendant_skill
                  .map((skill) => skill.skill_name)
                  .filter((name) => effect.includes(name)),
          ultimateOnly:
            ultimate &&
            base !== undefined &&
            !module.available_descendant_id.includes(base.descendant_id),
        },
      ];
    });
  const research = researchFor(
    sets.research,
    "Character",
    "descendant_id",
    entry.descendant_id,
  );
  const order = descendantSummaries(sets.descendants);
  const index = order.findIndex((item) => item.slug === slug);
  const neighbor = (at: number): DescendantLink | null => {
    const item = order.at(at);
    return at < 0 || item === undefined
      ? null
      : { slug: item.slug, name: item.name, ultimate: item.ultimate };
  };
  return {
    slug,
    name: entry.descendant_name,
    imageUrl: entry.descendant_image_url,
    ultimate,
    pair:
      base === undefined || ultimateMate === undefined
        ? null
        : [linkTo(base), linkTo(ultimateMate)],
    baseName: ultimate && base !== undefined ? base.descendant_name : null,
    previous: neighbor(index - 1),
    next: neighbor(index + 1),
    levels,
    stats,
    skills: entry.descendant_skill.map((skill) => ({
      type: skill.skill_type,
      name: skill.skill_name,
      element: skill.element_type,
      archeType: skill.arche_type,
      imageUrl: skill.skill_image_url,
      description: skill.skill_description,
    })),
    elements: unique(entry.descendant_skill.map((skill) => skill.element_type)),
    archeTypes: archeTypesOf(entry),
    modules,
    research: recipeFor(research, sets),
  };
}

// One fetch of each set per build worker (Next.js prerenders in several), however many
// pages use it. Every page's palette lists the Descendants, so descendant.json is
// fetched on its own; the module, stat, research and material sets come through
// `shared-sets.ts`, shared with the modules index and the weapon pages.
let descendantsPromise: Promise<DescendantRecord[]> | null = null;
let setsPromise: Promise<DescendantSets> | null = null;

function fetchDescendants(): Promise<DescendantRecord[]> {
  descendantsPromise ??= fetchMetadataSet("descendant", descendantSchema);
  return descendantsPromise;
}

function fetchDescendantSets(): Promise<DescendantSets> {
  setsPromise ??= Promise.all([
    fetchDescendants(),
    fetchStats(),
    fetchModules(),
    fetchResearch(),
    fetchMaterials(),
  ]).then(([descendants, stats, modules, research, materials]) => ({
    descendants,
    stats,
    modules,
    research,
    materials,
  }));
  return setsPromise;
}

/** Each Descendant's link by NEXON id, for pages that name who can equip a module. */
export function descendantLinksById(
  descendants: readonly DescendantRecord[],
): Map<string, DescendantLink> {
  return new Map(
    descendants.map((entry) => [entry.descendant_id, linkTo(entry)]),
  );
}

/** Each Descendant's link by NEXON id, fetched while pages are prerendered (ADR 0025). */
export async function fetchDescendantLinks(): Promise<
  Map<string, DescendantLink>
> {
  return descendantLinksById(await fetchDescendants());
}

/** Every Descendant, newest first, fetched while pages are prerendered (ADR 0023). */
export async function fetchDescendantSummaries(): Promise<DescendantSummary[]> {
  return descendantSummaries(await fetchDescendants());
}

/** A Descendant's page, fetched while it is prerendered (ADR 0008, ADR 0023). */
export async function fetchDescendantPage(
  slug: string,
): Promise<DescendantPage | null> {
  return descendantPageFrom(await fetchDescendantSets(), slug);
}
