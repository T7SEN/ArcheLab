import "server-only";
import { z } from "zod";
import {
  componentCoreTypeIds,
  coreSlotsPerListed,
} from "@/data/component-core-slots";
import { componentSubStatIds } from "@/data/component-sub-stats";
import type { ComponentLevel } from "@/features/external-components/component-levels";
import type { CoreType } from "@/features/game-data/core-types";
import { slugOf } from "@/lib/slug";
import { fetchCoreTypes } from "./core-types";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";
import { fetchStats, numericId, type StatRecord } from "./shared-sets";

/**
 * The external components index (ADR 0027): every component in
 * `external-component.json`, one card per set. NEXON lists 180 components: 36 sets of
 * four pieces, one per slot, each set in one tier, with 2- and 4-piece bonuses; and
 * HP Support, Shield Enhancement and DEF Support, each in four slots and three tiers,
 * with no set. Each piece has one base stat at levels 1 to 100.
 */

const componentSchema = z.object({
  external_component_id: numericId,
  external_component_name: z.string().min(1),
  image_url: nexonImageUrl,
  external_component_equipment_type: z.string().min(1),
  external_component_tier_id: z.string().regex(/^Tier\d+$/),
  available_core_slot: z.array(numericId),
  base_stat: z.array(
    z.object({
      level: z.number().int().positive(),
      stat_id: numericId,
      stat_value: z.number(),
    }),
  ),
  set_option_detail: z.array(
    z.object({
      set_option: z.string().min(1),
      set_count: z.number().int().positive(),
      set_option_effect: z.string(),
    }),
  ),
});

export type ComponentRecord = z.infer<typeof componentSchema>;

/** One component: a slot's piece at one tier. */
export interface ComponentPiece {
  /** NEXON's component id. */
  readonly id: string;
  readonly name: string;
  /** Its slot, such as "Auxiliary Power". */
  readonly slot: string;
  /** NEXON's tier id, such as "Tier3". */
  readonly tier: string;
  readonly imageUrl: string;
  /** Its base stat's name, such as "Max HP", or null when `stat.json` has none. */
  readonly stat: string | null;
  readonly coreSlots: number;
  /** Lowest level first. */
  readonly levels: readonly ComponentLevel[];
}

/** A set's bonus for wearing this many of its pieces. */
export interface SetBonus {
  readonly count: number;
  /** As NEXON words it. */
  readonly effect: string;
}

/** A card: a set's four pieces, or one component name's pieces at every tier. */
export interface ComponentGroup {
  readonly slug: string;
  /** The set's name, or the components' name without the slot ("HP Support"). */
  readonly name: string;
  readonly kind: "set" | "standalone";
  /** Lowest count first; empty without a set. */
  readonly bonuses: readonly SetBonus[];
  /** Highest tier first, then in slot order. */
  readonly pieces: readonly ComponentPiece[];
}

/** The slots in the order the game lists them; any new one follows, A–Z. */
export const slotOrder: readonly string[] = [
  "Auxiliary Power",
  "Sensor",
  "Memory",
  "Processor",
];

const rank = (value: string, order: readonly string[]) => {
  const at = order.indexOf(value);
  return at === -1 ? order.length : at;
};

const tierNumber = (tier: string) => Number(tier.replace(/\D/g, "")) || 0;

/** A component's name without its slot: "HP Support Sensor" is "HP Support". */
function baseName(entry: ComponentRecord): string {
  const suffix = ` ${entry.external_component_equipment_type}`;
  return entry.external_component_name.endsWith(suffix)
    ? entry.external_component_name.slice(0, -suffix.length)
    : entry.external_component_name;
}

/**
 * Every component in cards, A–Z: one per set (its `set_option`), and one per name for
 * components with no set, the slot left out of the name.
 */
export function componentGroups(
  components: readonly ComponentRecord[],
  stats: readonly StatRecord[],
): ComponentGroup[] {
  const statNames = new Map(
    stats.map((stat) => [stat.stat_id, stat.stat_name]),
  );
  const byKey = new Map<string, ComponentRecord[]>();
  for (const entry of components) {
    const set = entry.set_option_detail.at(0)?.set_option;
    const key =
      set === undefined ? `standalone:${baseName(entry)}` : `set:${set}`;
    byKey.set(key, [...(byKey.get(key) ?? []), entry]);
  }
  return [...byKey]
    .map(([key, entries]): ComponentGroup => {
      const kind = key.startsWith("set:") ? "set" : "standalone";
      const name = key.slice(key.indexOf(":") + 1);
      const pieces = [...entries].sort(
        (a, b) =>
          tierNumber(b.external_component_tier_id) -
            tierNumber(a.external_component_tier_id) ||
          rank(a.external_component_equipment_type, slotOrder) -
            rank(b.external_component_equipment_type, slotOrder) ||
          a.external_component_equipment_type.localeCompare(
            b.external_component_equipment_type,
          ),
      );
      // A set's pieces all carry the same bonuses (checked 2026-10-16).
      const bonuses = [...(pieces.at(0)?.set_option_detail ?? [])]
        .sort((a, b) => a.set_count - b.set_count)
        .map((bonus) => ({
          count: bonus.set_count,
          // Shell Crusher's 4-set effect has a literal "\n" where the others have a
          // line break, and the game shows a line break there (T7SEN's screenshot,
          // 2026-10-17).
          effect: bonus.set_option_effect.replaceAll("\\n", "\n"),
        }));
      return {
        slug: slugOf(name),
        name,
        kind,
        bonuses,
        pieces: pieces.map((entry) => {
          const levels = [...entry.base_stat].sort((a, b) => a.level - b.level);
          // One base stat per piece, the same at every level (checked 2026-10-16).
          const statId = levels.at(0)?.stat_id;
          return {
            id: entry.external_component_id,
            name: entry.external_component_name,
            slot: entry.external_component_equipment_type,
            tier: entry.external_component_tier_id,
            imageUrl: entry.image_url,
            stat: statId === undefined ? null : (statNames.get(statId) ?? null),
            // Each core slot NEXON lists is two in game (`component-core-slots.ts`).
            coreSlots: entry.available_core_slot.length * coreSlotsPerListed,
            levels: levels.map((level) => ({
              level: level.level,
              value: level.stat_value,
            })),
          };
        }),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Each slot's possible sub-stats (`component-sub-stats.ts`), named from `stat.json`, in
 * the order listed. A stat `stat.json` no longer names is left out.
 */
export function componentSubStats(
  stats: readonly StatRecord[],
): Record<string, string[]> {
  const statNames = new Map(
    stats.map((stat) => [stat.stat_id, stat.stat_name]),
  );
  return Object.fromEntries(
    Object.entries(componentSubStatIds).map(([slot, ids]) => [
      slot,
      ids.flatMap((id) => {
        const name = statNames.get(id);
        return name === undefined ? [] : [name];
      }),
    ]),
  );
}

/** Each slot's possible sub-stats, named while pages are prerendered (ADR 0027). */
export async function fetchComponentSubStats(): Promise<
  Record<string, string[]>
> {
  return componentSubStats(await fetchStats());
}

/**
 * The core types an Ultimate piece's two slots take (`component-core-slots.ts`): one
 * Recovery Augmentation core and one Defense Augmentation core, read while pages are
 * prerendered (ADR 0027).
 */
export function fetchComponentCoreSlots(): Promise<CoreType[]> {
  return fetchCoreTypes(componentCoreTypeIds.map((id) => ({ id })));
}

// One fetch per build worker: the index, the data files, the palette and the home page
// all read it.
let groupsPromise: Promise<ComponentGroup[]> | null = null;

/** Every external component card, fetched while pages are prerendered (ADR 0027). */
export function fetchComponentGroups(): Promise<ComponentGroup[]> {
  groupsPromise ??= Promise.all([
    fetchMetadataSet("external-component", componentSchema),
    fetchStats(),
  ]).then(([components, stats]) => componentGroups(components, stats));
  return groupsPromise;
}
