import "server-only";
import { z } from "zod";
import { isMeleeModule } from "@/data/melee-modules";
import type { ModuleLevel } from "@/features/modules/module-levels";
import { slugOf } from "@/lib/slug";
import { fetchDescendantLinks, type DescendantLink } from "./descendant-page";
import { fetchMetadataSet } from "./metadata";
import { fetchModules, type ModuleRecord } from "./shared-sets";

/**
 * The modules index (ADR 0025): every module in `module.json`, grouped by name. NEXON
 * lists one module per rounds type, weapon type or melee use, so 1,001 entries carry
 * 573 names; a group holds each version, in a fixed order, with its own numbers.
 */

const weaponTypeSchema = z.object({
  weapon_type: z.string().min(1),
  weapon_type_name: z.string().min(1),
});

type WeaponTypeRecord = z.infer<typeof weaponTypeSchema>;

/** "Descendant", a firearm rounds class such as "Impact Rounds", or this. */
export const meleeCategory = "Melee Weapon";
export const descendantCategory = "Descendant";

/** One module of a group: what sets it apart, its facts and its levels. */
export interface ModuleVariant {
  /** NEXON's module id. */
  readonly id: string;
  /** What sets it apart from the group's other versions: "High-Power Rounds · Sniper Rifle". */
  readonly label: string;
  /** "Descendant", the rounds class of a firearm module, or "Melee Weapon". */
  readonly category: string;
  /** The rounds a weapon must use, for firearm and melee modules. */
  readonly rounds: string | null;
  /** The weapon types it is limited to, by name; empty when it has no limit. */
  readonly weaponTypes: readonly string[];
  /** NEXON's tier id, such as "Tier3". */
  readonly tier: string;
  readonly socket: string | null;
  readonly type: string | null;
  /** The Descendant module slots it fits. */
  readonly slots: readonly string[];
  /** The Descendants who alone can equip it; empty when anyone can. */
  readonly owners: readonly DescendantLink[];
  readonly imageUrl: string;
  /**
   * Capacity at its lowest and its highest level, or null for none (Trigger modules).
   * It can fall as a module levels up, as Transcendent modules' does.
   */
  readonly capacity: { readonly from: number; readonly to: number } | null;
  /** Lowest level first. */
  readonly levels: readonly ModuleLevel[];
}

/** The modules that share a name. */
export interface ModuleGroup {
  readonly slug: string;
  readonly name: string;
  readonly variants: readonly ModuleVariant[];
}

/** Versions and the class filter run in this order: Descendant, each firearm rounds class, then melee. */
export const moduleCategoryOrder: readonly string[] = [
  descendantCategory,
  "General Rounds",
  "Special Rounds",
  "Impact Rounds",
  "High-Power Rounds",
  meleeCategory,
];

function rank(value: string, order: readonly string[]): number {
  const at = order.indexOf(value);
  return at === -1 ? order.length : at;
}

/** A version's rounds rank, so melee versions run Impact, then High-Power, too. */
function roundsRank(rounds: string | null): number {
  return rounds === null ? -1 : rank(rounds, moduleCategoryOrder);
}

function variantFrom(
  entry: ModuleRecord & {
    readonly module_class: string;
    readonly available_weapon_type: readonly string[];
  },
  weaponTypeNames: ReadonlyMap<string, string>,
  descendants: ReadonlyMap<string, DescendantLink>,
): ModuleVariant | null {
  const levels = [...entry.module_stat]
    .sort((a, b) => a.level - b.level)
    .map((level) => ({
      level: level.level,
      capacity: level.module_capacity,
      effect: level.value,
    }));
  const first = levels.at(0);
  const last = levels.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  const descendantModule = entry.module_class === descendantCategory;
  const melee = !descendantModule && isMeleeModule(entry.module_id);
  const category = melee ? meleeCategory : entry.module_class;
  const rounds = descendantModule ? null : entry.module_class;
  const weaponTypes = entry.available_weapon_type
    .map((type) => weaponTypeNames.get(type) ?? type)
    .sort((a, b) => a.localeCompare(b));
  const label = [
    melee ? `${meleeCategory} · ${entry.module_class}` : entry.module_class,
    ...(weaponTypes.length === 0 ? [] : [weaponTypes.join(", ")]),
  ].join(" · ");
  return {
    id: entry.module_id,
    label,
    category,
    rounds,
    weaponTypes,
    tier: entry.module_tier_id,
    socket: entry.module_socket_type,
    type: entry.module_type,
    slots: entry.available_module_slot_type,
    owners: entry.available_descendant_id.flatMap((id) => {
      const link = descendants.get(id);
      return link === undefined ? [] : [link];
    }),
    imageUrl: entry.image_url,
    capacity:
      first.capacity === null || last.capacity === null
        ? null
        : { from: first.capacity, to: last.capacity },
    levels,
  };
}

/** Versions whose labels match get their socket too, so each reads differently. */
function distinctLabels(variants: readonly ModuleVariant[]): ModuleVariant[] {
  const count = new Map<string, number>();
  for (const variant of variants) {
    count.set(variant.label, (count.get(variant.label) ?? 0) + 1);
  }
  return variants.map((variant) =>
    (count.get(variant.label) ?? 0) > 1 && variant.socket !== null
      ? { ...variant, label: `${variant.label} · ${variant.socket}` }
      : variant,
  );
}

/**
 * Every module grouped by name, A–Z, each group's versions in a fixed order: Descendant,
 * General, Special, Impact and High-Power Rounds, then melee; by weapon type, then id,
 * within those. A module whose class or weapon types failed validation is left out.
 */
export function moduleGroups(
  modules: readonly ModuleRecord[],
  weaponTypes: readonly WeaponTypeRecord[],
  descendants: ReadonlyMap<string, DescendantLink>,
): ModuleGroup[] {
  const weaponTypeNames = new Map(
    weaponTypes.map((type) => [type.weapon_type, type.weapon_type_name]),
  );
  const byName = new Map<string, ModuleVariant[]>();
  for (const entry of modules) {
    const moduleClass = entry.module_class;
    const allowed = entry.available_weapon_type;
    if (moduleClass === null || allowed === null) {
      continue;
    }
    const variant = variantFrom(
      { ...entry, module_class: moduleClass, available_weapon_type: allowed },
      weaponTypeNames,
      descendants,
    );
    if (variant === null) {
      continue;
    }
    const group = byName.get(entry.module_name) ?? [];
    group.push(variant);
    byName.set(entry.module_name, group);
  }
  return [...byName]
    .map(([name, variants]) => ({
      slug: slugOf(name),
      name,
      variants: distinctLabels(
        [...variants].sort(
          (a, b) =>
            rank(a.category, moduleCategoryOrder) -
              rank(b.category, moduleCategoryOrder) ||
            roundsRank(a.rounds) - roundsRank(b.rounds) ||
            a.weaponTypes.join().localeCompare(b.weaponTypes.join()) ||
            Number(a.id) - Number(b.id),
        ),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// One fetch of each set per build worker: the index page and every data file read them.
let groupsPromise: Promise<ModuleGroup[]> | null = null;

/** Every module group, fetched while pages are prerendered (ADR 0008, ADR 0025). */
export function fetchModuleGroups(): Promise<ModuleGroup[]> {
  groupsPromise ??= Promise.all([
    fetchModules(),
    fetchMetadataSet("weapon-type", weaponTypeSchema),
    fetchDescendantLinks(),
  ]).then(([modules, weaponTypes, descendants]) =>
    moduleGroups(modules, weaponTypes, descendants),
  );
  return groupsPromise;
}
