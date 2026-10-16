import "server-only";
import { z } from "zod";
import { slugOf } from "@/lib/slug";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";
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
 * A weapon's page (ADR 0024): ATK at every level, the base stats, the unique ability,
 * the core slot and the research recipe, all from NEXON's metadata. The schema reads
 * only the fields the page uses; an entry that fails is left out.
 */

const weaponSchema = z.object({
  weapon_id: numericId,
  weapon_name: z.string().min(1),
  image_url: nexonImageUrl,
  weapon_type: z.string().min(1),
  weapon_tier_id: z.string().regex(/^Tier\d+$/),
  weapon_rounds_type: z.string().min(1).nullable(),
  available_core_slot: z.array(numericId),
  base_stat: z.array(z.object({ stat_id: numericId, stat_value: z.number() })),
  firearm_atk: z.array(
    z.object({
      level: z.number().int().positive(),
      firearm: z.array(
        z.object({
          firearm_atk_type: numericId,
          firearm_atk_value: z.number(),
        }),
      ),
    }),
  ),
  weapon_perk_ability_name: z.string().min(1).nullable(),
  weapon_perk_ability_description: z.string().min(1).nullable(),
  weapon_perk_ability_image_url: nexonImageUrl.nullable(),
});

export type WeaponRecord = z.infer<typeof weaponSchema>;

/** The NEXON sets a weapon's page reads. */
export interface WeaponSets extends ResearchSets {
  readonly weapons: readonly WeaponRecord[];
  readonly stats: readonly StatRecord[];
}

/** An ATK type with one value per level, as the level slider shows it. */
export interface WeaponAttack {
  /** "Firearm ATK", "Fire ATK", "Melee Weapon ATK" and so on, from `stat.json`. */
  readonly name: string;
  /** One value per entry of `WeaponPage.levels`. */
  readonly values: readonly number[];
  /** Weapons have no base to compare with. */
  readonly baseValues: null;
}

export interface WeaponStat {
  readonly name: string;
  readonly value: number;
}

export interface WeaponAbility {
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string | null;
}

/** A link to a weapon's page. */
export interface WeaponLink {
  readonly slug: string;
  readonly name: string;
}

/** A weapon as lists show it: the index, the palette and page neighbors. */
export interface WeaponSummary extends WeaponLink {
  readonly imageUrl: string;
  /** NEXON's tier id, such as "Tier4". */
  readonly tier: string;
  readonly type: string;
  readonly rounds: string | null;
}

export interface WeaponPage {
  readonly slug: string;
  readonly name: string;
  readonly imageUrl: string;
  /** NEXON's tier id, such as "Tier4"; the chat registry names its rarity. */
  readonly tier: string;
  /** "Assault Rifle", "Hand Cannon" and so on. */
  readonly type: string;
  /** "General Rounds" and so on, or null when NEXON gives none. */
  readonly rounds: string | null;
  /** The levels NEXON lists ATK for, lowest first. */
  readonly levels: readonly number[];
  readonly attack: readonly WeaponAttack[];
  /** Every base stat, in NEXON's order. */
  readonly stats: readonly WeaponStat[];
  /** The unique ability, which Ultimate and Transcendent weapons have. */
  readonly ability: WeaponAbility | null;
  /** How many core slots it has. NEXON's open data doesn't say which cores fit. */
  readonly coreSlots: number;
  readonly research: Recipe | null;
  /** The weapons before and after it in the index's order (`weaponSummaries`). */
  readonly previous: WeaponLink | null;
  readonly next: WeaponLink | null;
}

/** A page address from a name: "Monster Hunter" is `monster-hunter`. */
export function weaponSlug(name: string): string {
  return slugOf(name);
}

const tierNumber = (tier: string): number => Number(tier.slice("Tier".length));

/**
 * Every weapon in the index's order: highest tier first, then NEXON's id order, which
 * runs by weapon type. Weapon ids don't follow release order (they encode type, tier and
 * a count), so there is no "newest first" for weapons (checked 2026-10-16, ADR 0024).
 */
export function weaponSummaries(
  weapons: readonly WeaponRecord[],
): WeaponSummary[] {
  return [...weapons]
    .sort(
      (a, b) =>
        tierNumber(b.weapon_tier_id) - tierNumber(a.weapon_tier_id) ||
        Number(a.weapon_id) - Number(b.weapon_id),
    )
    .map((entry) => ({
      slug: weaponSlug(entry.weapon_name),
      name: entry.weapon_name,
      imageUrl: entry.image_url,
      tier: entry.weapon_tier_id,
      type: entry.weapon_type,
      rounds: entry.weapon_rounds_type,
    }));
}

/**
 * ATK per type and level, types in NEXON's order at the lowest level. A type without a
 * name in `stat.json`, or missing at one of the levels, is left out.
 */
function attackOf(
  entry: WeaponRecord,
  levels: readonly number[],
  statNames: ReadonlyMap<string, string>,
): WeaponAttack[] {
  const byLevel = new Map(
    entry.firearm_atk.map((level) => [level.level, level.firearm]),
  );
  const types = [
    ...new Set(
      levels.flatMap(
        (level) =>
          byLevel.get(level)?.map((attack) => attack.firearm_atk_type) ?? [],
      ),
    ),
  ];
  return types.flatMap((type): WeaponAttack[] => {
    const name = statNames.get(type);
    const values = levels.map(
      (level) =>
        byLevel.get(level)?.find((attack) => attack.firearm_atk_type === type)
          ?.firearm_atk_value,
    );
    return name === undefined || values.some((value) => value === undefined)
      ? []
      : [
          {
            name,
            values: values.filter((value) => value !== undefined),
            baseValues: null,
          },
        ];
  });
}

/** A weapon's page from NEXON's sets, or null when NEXON lists no such weapon. */
export function weaponPageFrom(
  sets: WeaponSets,
  slug: string,
): WeaponPage | null {
  const entry = sets.weapons.find(
    (weapon) => weaponSlug(weapon.weapon_name) === slug,
  );
  if (entry === undefined) {
    return null;
  }
  const statNames = new Map(
    sets.stats.map((stat) => [stat.stat_id, stat.stat_name]),
  );
  const levels = entry.firearm_atk
    .map((level) => level.level)
    .sort((a, b) => a - b);
  const name = entry.weapon_perk_ability_name;
  const description = entry.weapon_perk_ability_description;
  const order = weaponSummaries(sets.weapons);
  const index = order.findIndex((item) => item.slug === slug);
  const neighbor = (at: number): WeaponLink | null => {
    const item = order.at(at);
    return at < 0 || item === undefined
      ? null
      : { slug: item.slug, name: item.name };
  };
  return {
    slug,
    name: entry.weapon_name,
    imageUrl: entry.image_url,
    tier: entry.weapon_tier_id,
    type: entry.weapon_type,
    rounds: entry.weapon_rounds_type,
    levels,
    attack: attackOf(entry, levels, statNames),
    stats: entry.base_stat.flatMap((stat): WeaponStat[] => {
      const statName = statNames.get(stat.stat_id);
      return statName === undefined
        ? []
        : [{ name: statName, value: stat.stat_value }];
    }),
    ability:
      name === null || description === null
        ? null
        : {
            name,
            description,
            imageUrl: entry.weapon_perk_ability_image_url,
          },
    coreSlots: entry.available_core_slot.length,
    research: recipeFor(
      researchFor(sets.research, "Equipment", "weapon_id", entry.weapon_id),
      sets,
    ),
    previous: neighbor(index - 1),
    next: neighbor(index + 1),
  };
}

// One fetch of weapon.json per build worker, however many pages use it.
let weaponsPromise: Promise<WeaponRecord[]> | null = null;

function fetchWeapons(): Promise<WeaponRecord[]> {
  weaponsPromise ??= fetchMetadataSet("weapon", weaponSchema);
  return weaponsPromise;
}

/** Every weapon in the index's order, fetched while pages are prerendered (ADR 0024). */
export async function fetchWeaponSummaries(): Promise<WeaponSummary[]> {
  return weaponSummaries(await fetchWeapons());
}

/** A weapon's page, fetched while it is prerendered (ADR 0008, ADR 0024). */
export async function fetchWeaponPage(
  slug: string,
): Promise<WeaponPage | null> {
  const [weapons, stats, research, materials] = await Promise.all([
    fetchWeapons(),
    fetchStats(),
    fetchResearch(),
    fetchMaterials(),
  ]);
  return weaponPageFrom({ weapons, stats, research, materials }, slug);
}
