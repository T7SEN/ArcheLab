import "server-only";
import { z } from "zod";
import { weaponCoreAlsoTakes } from "@/data/weapon-core-slots";
import {
  plainCoreKinds,
  type CoreComponent,
  type CoreDrop,
  type CoreKind,
  type CoreVersion,
  type CoreWeapon,
} from "@/features/cores/core-filters";
import { coreSlotName } from "@/features/game-data/core-types";
import { rarityOf } from "@/features/game-data/rarity";
import { withPlaceLinks } from "@/features/game-data/places";
import { slugOf } from "@/lib/slug";
import { fetchPlaceHrefs } from "./place-links";
import { fetchComponentGroups, type ComponentGroup } from "./component-index";
import {
  coreTypesFrom,
  fetchCoreTypeSets,
  type CoreTypeRecord,
} from "./core-types";
import { fetchMetadataSet } from "./metadata";
import {
  fetchAcquisitions,
  numericId,
  sourceText,
  type AcquisitionRecord,
  type MaterialRecord,
} from "./shared-sets";
import { coreSlotTypesOf, slotNameOf } from "./weapon-cores";
import {
  fetchWeaponCoreSlotIds,
  fetchWeaponSummaries,
  type WeaponSummary,
} from "./weapon-page";

/**
 * The Cores index (T7SEN, 2026-10-18; ADR 0044): one card per kind of core, by the slot
 * it goes in (Firepower, Attribute, Hit, Tactical, Precision and Special on Ultimate
 * weapons; Recovery and Defense on Ultimate external components). Each kind's versions
 * are the one-set core types of `core-type.json` some slot in the language-free
 * `core-slot.json` takes (a Launcher's Firepower rolls Explosive ATK); types no slot
 * takes are left out. Each grade's core items come with where they drop
 * (`acquisition_detail`, named by `acquisition-detail.json`). No Amorphous Material
 * Pattern gives a core (checked 2026-10-18). The weapons and external component cards
 * whose slots take a kind link their pages (T7SEN, 2026-10-18).
 */

const coreSlotSchema = z.object({
  core_slot_id: numericId,
  available_weapon_id: z.array(numericId),
  available_external_component_id: z.array(numericId),
  available_core_type_id: z.array(numericId),
});

export type CoreSlotRecord = z.infer<typeof coreSlotSchema>;

export interface CoreIndexSets {
  /** Pages for drop places, by NEXON's place id (`place-links.ts`). */
  readonly placeHrefs?: ReadonlyMap<string, string>;
  readonly coreTypes: readonly CoreTypeRecord[];
  readonly coreSlots: readonly CoreSlotRecord[];
  readonly materials: readonly MaterialRecord[];
  readonly acquisitions: readonly AcquisitionRecord[];
  /** Each Ultimate weapon's core slot ids, by name (`fetchWeaponCoreSlotIds`). */
  readonly weaponSlots: ReadonlyMap<string, readonly string[]>;
  readonly weapons: readonly WeaponSummary[];
  /** The external components index's cards, A–Z (`fetchComponentGroups`). */
  readonly componentGroups: readonly ComponentGroup[];
}

/**
 * The one-set core types a slot of this type takes: its own type for a typed slot, the
 * six whose sets a Free Augmentation variant holds for a Free slot (ADR 0042).
 */
function fitsOf(
  typeId: string,
  coreTypes: readonly CoreTypeRecord[],
): string[] {
  const type = coreTypes.find((entry) => entry.core_type_id === typeId);
  if (type === undefined) {
    return [];
  }
  const sets = new Set(type.core_option.map((set) => set.core_option_id));
  return coreTypes.flatMap((other) => {
    const only =
      other.core_option.length === 1 ? other.core_option.at(0) : undefined;
    return only !== undefined && sets.has(only.core_option_id)
      ? [other.core_type_id]
      : [];
  });
}

/** Every core kind with its versions, weapons, components and drops, in NEXON's id order. */
export function coreIndex(sets: CoreIndexSets): CoreKind[] {
  const { coreTypes } = sets;
  const nameOf = (id: string) =>
    coreTypes.find((type) => type.core_type_id === id)?.core_type;

  // Which weapons take each one-set type, through which slots.
  const summaries = new Map(
    sets.weapons.map((weapon) => [weapon.name, weapon]),
  );
  const takenBy = new Map<string, Map<string, string[]>>();
  for (const [name, slotIds] of sets.weaponSlots) {
    for (const slotType of coreSlotTypesOf(slotIds, sets.coreSlots)) {
      const slot = slotNameOf(slotType, coreTypes);
      if (slot === undefined) {
        continue;
      }
      for (const id of fitsOf(slotType, coreTypes)) {
        const weapons = takenBy.get(id) ?? new Map<string, string[]>();
        weapons.set(name, [...(weapons.get(name) ?? []), slot]);
        takenBy.set(id, weapons);
      }
    }
  }
  // How many Ultimate external components take each one-set type.
  const components = new Map<string, Set<string>>();
  for (const slot of sets.coreSlots) {
    for (const slotType of new Set(slot.available_core_type_id)) {
      for (const id of fitsOf(slotType, coreTypes)) {
        const pieces = components.get(id) ?? new Set<string>();
        for (const piece of slot.available_external_component_id) {
          pieces.add(piece);
        }
        components.set(id, pieces);
      }
    }
  }

  const used = [
    ...new Set([
      ...takenBy.keys(),
      ...[...components]
        .filter(([, pieces]) => pieces.size > 0)
        .map(([id]) => id),
    ]),
  ].sort((a, b) => Number(a) - Number(b));
  const kindNames = [...new Set(used.flatMap((id) => nameOf(id) ?? []))];

  const materials = new Map(
    sets.materials.map((material) => [
      material.consumable_material_name,
      material,
    ]),
  );
  const places = new Map(
    sets.acquisitions.map((place) => [
      place.acquisition_detail_id,
      sourceText(place.acquisition_detail_name),
    ]),
  );

  return kindNames.flatMap((name): CoreKind[] => {
    const ids = used.filter((id) => nameOf(id) === name);
    const types = coreTypesFrom(
      ids.map((id) => {
        const alsoTakes = weaponCoreAlsoTakes[id];
        return alsoTakes === undefined ? { id } : { id, alsoTakes };
      }),
      coreTypes,
      sets.materials,
    );
    const versions = types.map((type): CoreVersion => ({
      id: type.id,
      weaponTypes: [
        ...new Set(
          [...(takenBy.get(type.id)?.keys() ?? [])].flatMap(
            (weapon) => summaries.get(weapon)?.type ?? [],
          ),
        ),
      ].sort((a, b) => a.localeCompare(b)),
      grades: type.grades,
    }));
    const top = versions.at(0)?.grades.at(-1)?.cores.at(0);
    if (top === undefined) {
      return [];
    }

    // A weapon's slots that take this kind, in its slot order, across its versions.
    const weaponSlots = new Map<string, string[]>();
    for (const id of ids) {
      for (const [weapon, slots] of takenBy.get(id) ?? []) {
        weaponSlots.set(weapon, [...(weaponSlots.get(weapon) ?? []), ...slots]);
      }
    }
    const weapons = [...weaponSlots]
      .flatMap(([weapon, slots]): CoreWeapon[] => {
        const summary = summaries.get(weapon);
        return summary === undefined
          ? []
          : [
              {
                slug: summary.slug,
                name: summary.name,
                type: summary.type,
                slots,
              },
            ];
      })
      .sort(
        (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
      );

    // Each grade's core items across the versions, each once, with where it drops.
    const grades = [
      ...new Set(
        versions.flatMap((version) =>
          version.grades.map((entry) => entry.grade),
        ),
      ),
    ].sort((a, b) => a - b);
    // Defense and Recovery list their plain cores of each grade too (ADR 0050).
    const plainToo = plainCoreKinds.has(slugOf(coreSlotName(name)));
    const drops = grades.map((grade) => {
      const items = new Map<string, CoreDrop>();
      const add = (coreName: string, imageUrl: string) => {
        if (items.has(coreName)) {
          return;
        }
        const placeIds = materials.get(coreName)?.acquisition_detail ?? [];
        items.set(coreName, {
          name: coreName,
          imageUrl,
          sources: [...new Set(placeIds.flatMap((id) => places.get(id) ?? []))],
          ...withPlaceLinks(placeIds, places, sets.placeHrefs),
        });
      };
      for (const version of versions) {
        for (const core of version.grades.find((entry) => entry.grade === grade)
          ?.cores ?? []) {
          add(core.name, core.imageUrl);
          const plain = core.name.replace(" (Variant AB) ", " ");
          const material =
            plainToo && plain !== core.name ? materials.get(plain) : undefined;
          if (material !== undefined) {
            add(plain, material.image_url);
          }
        }
      }
      return { grade, items: [...items.values()] };
    });

    const slot = coreSlotName(name);
    const pieces = new Set(
      ids.flatMap((id) => [...(components.get(id) ?? [])]),
    );
    // The external component cards those pieces belong to, in the index's order.
    const componentCards = sets.componentGroups.flatMap(
      (group): CoreComponent[] => {
        const taking = group.pieces.filter((piece) => pieces.has(piece.id));
        const tier = taking.at(0)?.tier;
        return taking.length === 0
          ? []
          : [
              {
                slug: group.slug,
                name: group.name,
                set: group.kind === "set",
                tier:
                  tier === undefined ? null : (rarityOf(tier)?.name ?? null),
              },
            ];
      },
    );
    return [
      {
        slug: slugOf(slot),
        name,
        slot,
        equipment: weapons.length > 0 ? "weapons" : "components",
        imageUrl: top.imageUrl,
        versions,
        drops,
        weapons,
        componentCards,
      },
    ];
  });
}

let indexPromise: Promise<CoreKind[]> | null = null;

/** Every core kind, fetched once per build worker; none when NEXON can't be reached. */
export function fetchCoreKinds(): Promise<CoreKind[]> {
  indexPromise ??= Promise.all([
    fetchCoreTypeSets(),
    fetchMetadataSet("core-slot", coreSlotSchema),
    fetchAcquisitions(),
    fetchWeaponCoreSlotIds(),
    fetchWeaponSummaries(),
    fetchComponentGroups(),
    fetchPlaceHrefs(),
  ]).then(
    ([
      [coreTypes, materials],
      coreSlots,
      acquisitions,
      weaponSlots,
      weapons,
      componentGroups,
      placeHrefs,
    ]) =>
      coreIndex({
        coreTypes,
        coreSlots,
        materials,
        acquisitions,
        weaponSlots,
        weapons,
        componentGroups,
        placeHrefs,
      }),
  );
  return indexPromise;
}
