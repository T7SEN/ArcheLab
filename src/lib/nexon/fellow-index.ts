import "server-only";
import { z } from "zod";
import { slugOf } from "@/lib/slug";
import { fetchMetadataSet } from "./metadata";
import {
  recipeFor,
  researchFor,
  type Recipe,
  type ResearchSets,
} from "./recipe";
import {
  fetchMaterials,
  fetchResearch,
  fetchStats,
  numericId,
  type StatRecord,
} from "./shared-sets";

/**
 * The Fellows index (ADR 0035): every Fellow in `fellow.json`, with its stats at each
 * level, named from `stat.json`, and its research recipe. NEXON listed 3 Fellows on
 * 2026-10-17, each in one tier with levels 1 to 40 and no art.
 */

const fellowSchema = z.object({
  fellow_id: numericId,
  fellow_name: z.string().min(1),
  fellow_tier_id: z.string().regex(/^Tier\d+$/),
  fellow_detail: z
    .array(
      z.object({
        fellow_level: z.number().int().positive(),
        stat_effect: z
          .array(z.object({ stat_id: numericId, stat_value: z.number() }))
          .nullable(),
      }),
    )
    .min(1),
});

export type FellowRecord = z.infer<typeof fellowSchema>;

/** A stat at a level: its name from `stat.json`, its value as NEXON gives it. */
export interface FellowStat {
  readonly name: string;
  /** 0.25 is 25%. */
  readonly value: number;
}

export interface FellowLevel {
  readonly level: number;
  readonly stats: readonly FellowStat[];
}

export interface FellowGroup {
  /** NEXON's fellow id. */
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  /** NEXON's tier id, such as `Tier1`. */
  readonly tier: string;
  /** In level order. */
  readonly levels: readonly FellowLevel[];
  /** Its `Fellow` research, when NEXON lists one. */
  readonly research: Recipe | null;
}

/**
 * Each Fellow with its levels in order and its stats named; a stat `stat.json` doesn't
 * name is left out. In NEXON's order, by id.
 */
export function fellowGroups(
  fellows: readonly FellowRecord[],
  stats: readonly StatRecord[],
  sets: ResearchSets,
): FellowGroup[] {
  const statNames = new Map(
    stats.map((stat) => [stat.stat_id, stat.stat_name]),
  );
  return [...fellows]
    .sort((a, b) =>
      a.fellow_id.localeCompare(b.fellow_id, "en", { numeric: true }),
    )
    .map((fellow) => ({
      id: fellow.fellow_id,
      slug: slugOf(fellow.fellow_name),
      name: fellow.fellow_name,
      tier: fellow.fellow_tier_id,
      levels: [...fellow.fellow_detail]
        .sort((a, b) => a.fellow_level - b.fellow_level)
        .map((detail) => ({
          level: detail.fellow_level,
          stats: (detail.stat_effect ?? []).flatMap((effect) => {
            const name = statNames.get(effect.stat_id);
            return name === undefined
              ? []
              : [{ name, value: effect.stat_value }];
          }),
        })),
      research: recipeFor(
        researchFor(sets.research, "Fellow", "fellow_id", fellow.fellow_id),
        sets,
      ),
    }));
}

let groupsPromise: Promise<FellowGroup[]> | null = null;

/** Every Fellow, fetched once per build worker; none when NEXON can't be reached. */
export function fetchFellows(): Promise<FellowGroup[]> {
  groupsPromise ??= Promise.all([
    fetchMetadataSet("fellow", fellowSchema),
    fetchStats(),
    fetchResearch(),
    fetchMaterials(),
  ]).then(([fellows, stats, research, materials]) =>
    fellowGroups(fellows, stats, { research, materials }),
  );
  return groupsPromise;
}
