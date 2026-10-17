import "server-only";
import { z } from "zod";
import { weaponCoreAlsoTakes, weaponCoreSlots } from "@/data/weapon-core-slots";
import type { CoreType } from "@/features/game-data/core-types";
import {
  fetchCoreTypes,
  fetchCoreTypeSets,
  type CoreTypeChoice,
  type CoreTypeRecord,
} from "./core-types";
import { fetchMetadataSet } from "./metadata";
import { numericId } from "./shared-sets";
import { fetchWeaponCoreSlotIds } from "./weapon-page";

/**
 * Each Ultimate weapon's core slots, from NEXON's language-free `core-slot.json` (ADR
 * 0042): for each slot id a weapon lists, the core type each of its slots takes, by
 * `core-type.json` id, in the game's order. `src/data/weapon-core-slots.ts` is the
 * cross-check, warned about at build like the Mutant Cells' (ADR 0040).
 */

const coreSlotSchema = z.object({
  core_slot_id: numericId,
  available_weapon_id: z.array(numericId),
  available_core_type_id: z.array(numericId),
});

export type CoreSlotRecord = z.infer<typeof coreSlotSchema>;

/** The core types of a weapon's slots, in order, from the slot ids it lists. */
export function coreSlotTypesOf(
  slotIds: readonly string[],
  coreSlots: readonly CoreSlotRecord[],
): string[] {
  return slotIds.flatMap(
    (id) =>
      coreSlots.find((slot) => slot.core_slot_id === id)
        ?.available_core_type_id ?? [],
  );
}

/** A slot's name as the game shows it: "Firepower" for Firepower Augmentation. */
export function slotNameOf(
  typeId: string,
  coreTypes: readonly CoreTypeRecord[],
): string | undefined {
  return coreTypes
    .find((type) => type.core_type_id === typeId)
    ?.core_type.replace(/ Augmentation$/, "");
}

/**
 * The core types to show for a weapon's slots, lowest id first (Firepower, Attribute,
 * Hit, Tactical, Precision, Special), each with the slots it fits. A slot takes the
 * one-set types whose set its own type lists: a typed slot its own type, and a Free
 * slot the six whose sets its Free Augmentation variant holds, so a Launcher's Free slot
 * takes its Explosive ATK Firepower type. A type no slot takes isn't shown.
 */
export function weaponCoreTypeChoices(
  typeIds: readonly string[],
  coreTypes: readonly CoreTypeRecord[],
): CoreTypeChoice[] {
  const fits = new Map<string, Set<string>>();
  for (const id of typeIds) {
    const type = coreTypes.find((entry) => entry.core_type_id === id);
    const slot = slotNameOf(id, coreTypes);
    if (type === undefined || slot === undefined) {
      continue;
    }
    const sets = new Set(type.core_option.map((set) => set.core_option_id));
    for (const other of coreTypes) {
      const only =
        other.core_option.length === 1 ? other.core_option.at(0) : undefined;
      if (only !== undefined && sets.has(only.core_option_id)) {
        fits.set(
          other.core_type_id,
          (fits.get(other.core_type_id) ?? new Set()).add(slot),
        );
      }
    }
  }
  return [...fits]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([id, slots]) => {
      const alsoTakes = weaponCoreAlsoTakes[id];
      return {
        id,
        slots: [...slots],
        ...(alsoTakes === undefined ? {} : { alsoTakes }),
      };
    });
}

/**
 * How NEXON's slots differ from `weapon-core-slots.ts`'s, by weapon: a weapon on one
 * side only, or different slots.
 */
export function crossCheckWeaponCoreSlots(
  fromNexon: ReadonlyMap<string, readonly string[]>,
  ours: ReadonlyMap<string, readonly string[]>,
): string[] {
  const differences: string[] = [];
  for (const [name, slots] of ours) {
    const theirs = fromNexon.get(name);
    if (theirs === undefined) {
      differences.push(`${name} is in weapon-core-slots.ts, not NEXON's set.`);
    } else if (theirs.join(", ") !== slots.join(", ")) {
      differences.push(
        `${name} has ${theirs.join(", ")} in NEXON's set, ${slots.join(", ")} in weapon-core-slots.ts.`,
      );
    }
  }
  for (const name of fromNexon.keys()) {
    if (!ours.has(name)) {
      differences.push(`${name} is in NEXON's set, not weapon-core-slots.ts.`);
    }
  }
  return differences;
}

let setsPromise: Promise<{
  readonly slotTypes: ReadonlyMap<string, readonly string[]>;
  readonly coreTypes: readonly CoreTypeRecord[];
}> | null = null;

/**
 * Each weapon's slot types by name, fetched once per build worker and checked against
 * `weapon-core-slots.ts`; none when NEXON can't be reached.
 */
function fetchSets() {
  setsPromise ??= Promise.all([
    fetchMetadataSet("core-slot", coreSlotSchema),
    fetchWeaponCoreSlotIds(),
    fetchCoreTypeSets(),
  ]).then(([coreSlots, weapons, [coreTypes]]) => {
    const slotTypes = new Map(
      [...weapons]
        .map(([name, ids]) => [name, coreSlotTypesOf(ids, coreSlots)] as const)
        .filter(([, types]) => types.length > 0),
    );
    if (slotTypes.size > 0 && coreTypes.length > 0) {
      const names = new Map(
        [...slotTypes].map(([name, types]) => [
          name,
          types.map((id) => slotNameOf(id, coreTypes) ?? id),
        ]),
      );
      for (const difference of crossCheckWeaponCoreSlots(
        names,
        weaponCoreSlots,
      )) {
        console.warn(`Weapon core slots cross-check: ${difference}`);
      }
    }
    return { slotTypes, coreTypes };
  });
  return setsPromise;
}

/**
 * A weapon's core slots by name ("Free", "Firepower") and the core types they take;
 * none when NEXON's sets can't be loaded or don't list the weapon.
 */
export async function fetchWeaponCores(
  name: string,
): Promise<{ slots: string[]; types: CoreType[] }> {
  const { slotTypes, coreTypes } = await fetchSets();
  const typeIds = slotTypes.get(name) ?? [];
  const slots = typeIds.flatMap((id) => slotNameOf(id, coreTypes) ?? []);
  return slots.length === 0
    ? { slots: [], types: [] }
    : {
        slots,
        types: await fetchCoreTypes(weaponCoreTypeChoices(typeIds, coreTypes)),
      };
}

/** The weapons NEXON's set gives core slots, by name, for the Help fill in data page. */
export async function fetchWeaponsWithCoreSlots(): Promise<
  ReadonlySet<string>
> {
  return new Set((await fetchSets()).slotTypes.keys());
}
