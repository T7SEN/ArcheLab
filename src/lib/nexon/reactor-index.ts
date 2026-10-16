import "server-only";
import { z } from "zod";
import type { ReactorLevel } from "@/features/reactors/reactor-levels";
import { slugOf } from "@/lib/slug";
import {
  fetchDescendantSkillTypes,
  type DescendantSkillTypes,
} from "./descendant-page";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";
import { fetchStats, numericId, type StatRecord } from "./shared-sets";

/**
 * The reactors index (ADR 0026): every reactor in `reactor.json`, grouped by name. NEXON
 * lists each of the 20 reactors once per tier (Normal, Rare, Ultimate), each with its
 * own art and numbers; a group holds the three. Each reactor boosts one attribute and
 * one Arche type, which `skill_power_coefficient` names through `stat.json`.
 */

const reactorSchema = z.object({
  reactor_id: numericId,
  reactor_name: z.string().min(1),
  image_url: nexonImageUrl,
  reactor_tier_id: z.string().regex(/^Tier\d+$/),
  reactor_skill_power: z
    .array(
      z.object({
        level: z.number().int().positive(),
        skill_atk_power: z.number(),
        sub_skill_atk_power: z.number(),
        enchant_effect: z.array(
          z.object({
            enchant_level: z.number().int().positive(),
            stat_id: numericId,
            value: z.number(),
          }),
        ),
        skill_power_coefficient: z.array(
          z.object({
            coefficient_stat_id: numericId,
            coefficient_stat_value: z.number(),
          }),
        ),
      }),
    )
    .min(1),
});

export type ReactorRecord = z.infer<typeof reactorSchema>;

/** One of a reactor's boosts: a stat's name, such as "Fire Skill Power Boost Ratio". */
export interface ReactorBoost {
  readonly name: string;
  /** As NEXON gives it: 0.2 is a 20% boost. */
  readonly value: number;
}

/** A reactor at one tier. */
export interface ReactorVersion {
  /** NEXON's reactor id. */
  readonly id: string;
  /** NEXON's tier id, such as "Tier3". */
  readonly tier: string;
  readonly imageUrl: string;
  /** Lowest level first. */
  readonly levels: readonly ReactorLevel[];
}

/** A reactor with its three tiers. */
export interface ReactorGroup {
  readonly slug: string;
  readonly name: string;
  /** The attribute it boosts, such as "Fire", or null when its boosts name none. */
  readonly attribute: string | null;
  /** The Arche type it boosts, such as "Dimension", or null. */
  readonly archeType: string | null;
  readonly boosts: readonly ReactorBoost[];
  /** Highest tier first. */
  readonly versions: readonly ReactorVersion[];
  /** The Descendants it suits (`reactorMatch`), newest first. */
  readonly descendants: readonly DescendantSkillTypes[];
}

/**
 * Whether a Descendant suits a reactor of this attribute and Arche type: one of its
 * skills, as NEXON lists them, has both; or the Arche type is one T7SEN found in game
 * (`arche-types.ts`, Raven's Singular) and every skill has the attribute, so whichever
 * skills take that type, they have both (T7SEN, 2026-10-16). Skills of mixed
 * attributes don't count a found type: nothing says which skills take it.
 */
export function reactorMatch(
  descendant: DescendantSkillTypes,
  attribute: string,
  archeType: string,
): boolean {
  return (
    descendant.skills.some(
      (skill) => skill.element === attribute && skill.archeType === archeType,
    ) ||
    (descendant.extraArcheTypes.includes(archeType) &&
      descendant.skills.length > 0 &&
      descendant.skills.every((skill) => skill.element === attribute))
  );
}

/** The part of a boost's stat name before this suffix is what it boosts. */
const boostSuffix = " Skill Power Boost Ratio";

const tierNumber = (tier: string) => Number(tier.replace(/\D/g, "")) || 0;

/**
 * Every reactor grouped by name, A–Z. A boost names an attribute or an Arche type when
 * its stat name, less " Skill Power Boost Ratio", is one the Descendants' skills use.
 */
export function reactorGroups(
  reactors: readonly ReactorRecord[],
  stats: readonly StatRecord[],
  descendants: readonly DescendantSkillTypes[],
): ReactorGroup[] {
  const statNames = new Map(
    stats.map((stat) => [stat.stat_id, stat.stat_name]),
  );
  const elements = new Set(
    descendants.flatMap((entry) =>
      entry.skills.flatMap((skill) =>
        skill.element === null ? [] : [skill.element],
      ),
    ),
  );
  const archeTypes = new Set(
    descendants.flatMap((entry) =>
      entry.skills.flatMap((skill) =>
        skill.archeType === null ? [] : [skill.archeType],
      ),
    ),
  );
  const byName = new Map<string, ReactorRecord[]>();
  for (const entry of reactors) {
    byName.set(entry.reactor_name, [
      ...(byName.get(entry.reactor_name) ?? []),
      entry,
    ]);
  }
  return [...byName]
    .map(([name, entries]): ReactorGroup => {
      const versions = [...entries].sort(
        (a, b) =>
          tierNumber(b.reactor_tier_id) - tierNumber(a.reactor_tier_id) ||
          Number(a.reactor_id) - Number(b.reactor_id),
      );
      // The boosts don't change with level or tier (checked 2026-10-16).
      const boosts = (
        versions.at(0)?.reactor_skill_power.at(0)?.skill_power_coefficient ?? []
      ).flatMap((boost) => {
        const stat = statNames.get(boost.coefficient_stat_id);
        return stat === undefined
          ? []
          : [{ name: stat, value: boost.coefficient_stat_value }];
      });
      const boosted = boosts.flatMap((boost) =>
        boost.name.endsWith(boostSuffix)
          ? [boost.name.slice(0, -boostSuffix.length)]
          : [],
      );
      const attribute = boosted.find((type) => elements.has(type)) ?? null;
      const archeType = boosted.find((type) => archeTypes.has(type)) ?? null;
      return {
        slug: slugOf(name),
        name,
        attribute,
        archeType,
        boosts,
        versions: versions.map((entry) => ({
          id: entry.reactor_id,
          tier: entry.reactor_tier_id,
          imageUrl: entry.image_url,
          levels: [...entry.reactor_skill_power]
            .sort((a, b) => a.level - b.level)
            .map((level) => ({
              level: level.level,
              skillPower: level.skill_atk_power,
              subAttackPower: level.sub_skill_atk_power,
              enchants: [...level.enchant_effect]
                .sort((a, b) => a.enchant_level - b.enchant_level)
                .map((enchant) => ({
                  level: enchant.enchant_level,
                  stat: statNames.get(enchant.stat_id) ?? null,
                  value: enchant.value,
                })),
            })),
        })),
        descendants:
          attribute === null || archeType === null
            ? []
            : descendants.filter((entry) =>
                reactorMatch(entry, attribute, archeType),
              ),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// One fetch of each set per build worker: the index, the data files, Descendant pages,
// the palette and the home page all read them.
let groupsPromise: Promise<ReactorGroup[]> | null = null;

/** Every reactor group, fetched while pages are prerendered (ADR 0008, ADR 0026). */
export function fetchReactorGroups(): Promise<ReactorGroup[]> {
  groupsPromise ??= Promise.all([
    fetchMetadataSet("reactor", reactorSchema),
    fetchStats(),
    fetchDescendantSkillTypes(),
  ]).then(([reactors, stats, descendants]) =>
    reactorGroups(reactors, stats, descendants),
  );
  return groupsPromise;
}
