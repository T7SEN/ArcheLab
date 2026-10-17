import "server-only";
import { z } from "zod";
import { patternInGame, patternTier } from "@/data/amorphous-materials";
import {
  patternPrefix,
  type AmorphousBuild,
  type AmorphousPattern,
  type BuildKind,
  type AmorphousReward,
} from "@/features/amorphous/amorphous-filters";
import { slugOf } from "@/lib/slug";
import { fetchDescendantLinks } from "./descendant-page";
import { fetchFellows } from "./fellow-index";
import { fetchMetadataSet } from "./metadata";
import {
  fetchMaterials,
  fetchResearch,
  numericId,
  type MaterialRecord,
  type ResearchRecord,
} from "./shared-sets";
import { fetchVehicles } from "./vehicle-index";
import { fetchWeaponLinks } from "./weapon-page";

/**
 * The Amorphous Materials index (T7SEN, 2026-10-17; ADR 0041): every Amorphous Material
 * Pattern in `consumable-material.json` that is still in the game (the named ones: 45 of
 * 249 on 2026-10-17; `src/data/amorphous-materials.ts`), with what it opens into from
 * `amorphous-reward.json` (five research materials with their chances, or one sure
 * Code), what each reward is a part of, and where the pattern drops from its
 * `acquisition_detail` (listed for 44), named by `acquisition-detail.json`. NEXON's data
 * doesn't say where a pattern is opened, so the page doesn't either (T7SEN).
 */

const rewardSchema = z.object({
  amorphous_reward_id: numericId,
  open_reward: z.array(
    z.object({
      reward_type: z.string(),
      required_stabilizer: numericId.nullable(),
      reward_item: z.array(
        z.object({
          meta_type: z.string(),
          meta_id: numericId,
          rate: z.number().nonnegative(),
        }),
      ),
    }),
  ),
});

const acquisitionSchema = z.object({
  acquisition_detail_id: z.string().min(1),
  acquisition_detail_name: z.string().min(1),
});

export type AmorphousRewardRecord = z.infer<typeof rewardSchema>;
export type AcquisitionRecord = z.infer<typeof acquisitionSchema>;

/** The Descendants, weapons, Fellows and vehicles a reward can be part of, by NEXON id. */
export type BuildTargets = ReadonlyMap<string, AmorphousBuild>;

export interface AmorphousSets {
  readonly materials: readonly MaterialRecord[];
  readonly rewards: readonly AmorphousRewardRecord[];
  readonly acquisitions: readonly AcquisitionRecord[];
  readonly research: readonly ResearchRecord[];
}

export interface AmorphousIndex {
  readonly patterns: readonly AmorphousPattern[];
}

/** NEXON's acquisition names with their bracket padding gone: "[Kingston] [Normal]". */
export function sourceText(name: string): string {
  return name.replace(/\[\s+/g, "[").replace(/\s+\]/g, "]").trim();
}

/**
 * What an item is a part of. First NEXON's research: the Descendant, weapon, Fellow or
 * vehicle researched with it, or with what it is researched into ("Bunny Code" makes
 * Bunny). When that names exactly one, that's it. Otherwise its name: a Blueprint is
 * named for what it makes ("Ultimate Bunny Spiral Catalyst Blueprint"), so the longest
 * build name it starts with. Null for shared materials such as Crystallization
 * Catalyst.
 */
export function buildOf(
  item: { readonly id: string; readonly name: string },
  research: readonly ResearchRecord[],
  targets: BuildTargets,
): AmorphousBuild | null {
  const usedIn = (id: string) =>
    research.filter((entry) =>
      entry.research_material.some((input) => input.meta_id === id),
    );
  const found = new Map<string, AmorphousBuild>();
  for (const entry of usedIn(item.id)) {
    for (const result of entry.research_result) {
      const direct = targets.get(result.meta_id);
      if (direct !== undefined) {
        found.set(direct.slug, direct);
        continue;
      }
      // A part: what that part is researched into.
      for (const next of usedIn(result.meta_id)) {
        for (const made of next.research_result) {
          const build = targets.get(made.meta_id);
          if (build !== undefined) {
            found.set(build.slug, build);
          }
        }
      }
    }
  }
  if (found.size === 1) {
    return [...found.values()][0] ?? null;
  }
  const byName = [...targets.values()]
    .filter((build) => item.name.startsWith(`${build.name} `))
    .sort((a, b) => b.name.length - a.name.length);
  return byName.at(0) ?? null;
}

/**
 * What a pattern is for: the Descendant, weapon, Fellow or vehicle it is named after
 * ("Orca"), else what most of its rewards build, else nothing.
 */
export function patternKind(
  name: string,
  rewards: readonly AmorphousReward[],
  targets: BuildTargets,
): BuildKind | null {
  const named = [...targets.values()].find((build) => build.name === name);
  if (named !== undefined) {
    return named.kind;
  }
  const counts = new Map<BuildKind, number>();
  for (const reward of rewards) {
    if (reward.build !== null) {
      counts.set(reward.build.kind, (counts.get(reward.build.kind) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1]).at(0)?.[0] ?? null;
}

/**
 * Every pattern still in the game with its tier, what it is for, its rewards and where
 * it drops: highest tier first, then A–Z. A removed pattern NEXON still lists
 * (`patternInGame`) and one NEXON gives no rewards for are left out.
 */
export function amorphousIndex(
  sets: AmorphousSets,
  targets: BuildTargets,
): AmorphousIndex {
  const materials = new Map(
    sets.materials.map((material) => [
      material.consumable_material_id,
      material,
    ]),
  );
  const rewards = new Map(
    sets.rewards.map((reward) => [reward.amorphous_reward_id, reward]),
  );
  const places = new Map(
    sets.acquisitions.map((place) => [
      place.acquisition_detail_id,
      sourceText(place.acquisition_detail_name),
    ]),
  );
  const patterns = sets.materials
    .filter(
      (material) =>
        material.material_type === "AmorphousMaterial" &&
        material.consumable_material_name.startsWith(patternPrefix) &&
        patternInGame(
          material.consumable_material_name.slice(patternPrefix.length),
        ),
    )
    .flatMap((material): AmorphousPattern[] => {
      const reward = (material.amorphous_reward ?? [])
        .flatMap((id) => {
          const record = rewards.get(id);
          return record === undefined ? [] : [record];
        })
        .at(0);
      // The plain opening: one needing no Shape Stabilizer (none needs one since
      // Update 1.4.0 removed them).
      const opening =
        reward?.open_reward.find(
          (entry) => entry.required_stabilizer === null,
        ) ?? reward?.open_reward.at(0);
      const items = (opening?.reward_item ?? []).flatMap(
        (entry): AmorphousReward[] => {
          const item = materials.get(entry.meta_id);
          if (
            entry.meta_type !== "consumable_material_id" ||
            item === undefined
          ) {
            return [];
          }
          const build = buildOf(
            {
              id: item.consumable_material_id,
              name: item.consumable_material_name,
            },
            sets.research,
            targets,
          );
          return [
            {
              id: item.consumable_material_id,
              name: item.consumable_material_name,
              imageUrl: item.image_url,
              rate: entry.rate,
              build,
            },
          ];
        },
      );
      if (items.length === 0) {
        return [];
      }
      const name = material.consumable_material_name.slice(
        patternPrefix.length,
      );
      return [
        {
          slug: slugOf(name),
          name,
          tier: patternTier(name),
          kind: patternKind(name, items, targets),
          imageUrl: material.image_url,
          rewards: items,
          sources: [
            ...new Set(
              material.acquisition_detail.flatMap((id) => {
                const place = places.get(id);
                return place === undefined ? [] : [place];
              }),
            ),
          ],
        },
      ];
    })
    .sort(
      (a, b) =>
        b.tier.localeCompare(a.tier, "en", { numeric: true }) ||
        a.name.localeCompare(b.name, "en", { numeric: true }),
    );
  return { patterns };
}

let indexPromise: Promise<AmorphousIndex> | null = null;

/** Every pattern, fetched once per build worker; none when NEXON can't be reached. */
export function fetchAmorphousPatterns(): Promise<AmorphousIndex> {
  indexPromise ??= Promise.all([
    fetchMaterials(),
    fetchMetadataSet("amorphous-reward", rewardSchema),
    fetchMetadataSet("acquisition-detail", acquisitionSchema),
    fetchResearch(),
    fetchDescendantLinks(),
    fetchWeaponLinks(),
    fetchFellows(),
    fetchVehicles(),
  ]).then(
    ([
      materials,
      rewards,
      acquisitions,
      research,
      descendants,
      weapons,
      fellows,
      vehicles,
    ]) => {
      const targets = new Map<string, AmorphousBuild>([
        ...[...descendants].map(([id, link]): [string, AmorphousBuild] => [
          id,
          { kind: "descendant", slug: link.slug, name: link.name },
        ]),
        ...[...weapons].map(([id, link]): [string, AmorphousBuild] => [
          id,
          { kind: "weapon", slug: link.slug, name: link.name },
        ]),
        ...fellows.map((fellow): [string, AmorphousBuild] => [
          fellow.id,
          { kind: "fellow", slug: fellow.slug, name: fellow.name },
        ]),
        ...vehicles.map((vehicle): [string, AmorphousBuild] => [
          vehicle.id,
          { kind: "vehicle", slug: vehicle.slug, name: vehicle.name },
        ]),
      ]);
      return amorphousIndex(
        { materials, rewards, acquisitions, research },
        targets,
      );
    },
  );
  return indexPromise;
}
