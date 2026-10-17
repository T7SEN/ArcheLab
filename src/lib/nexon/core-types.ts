import "server-only";
import { z } from "zod";
import {
  romanGrade,
  type CoreGrade,
  type CoreItem,
  type CoreOption,
  type CoreType,
} from "@/features/game-data/core-types";
import { fetchMetadataSet } from "./metadata";
import { fetchMaterials, numericId, type MaterialRecord } from "./shared-sets";

/**
 * Core types from NEXON's `core-type.json`, shared by weapon pages and the external
 * components index (ADR 0024, ADR 0027). Which types a slot takes is not in the keyless
 * data (`core-slot` answers 403); it comes from T7SEN's in-game checks in `src/data`.
 */

const coreTypeSchema = z.object({
  core_type_id: numericId,
  core_type: z.string().min(1),
  core_option: z.array(
    z.object({
      detail: z.array(
        z.object({
          required_core_item: z
            .object({ meta_type: z.string(), meta_id: numericId })
            .nullable(),
          available_item_option: z.array(
            z.object({
              item_option: z.string().min(1),
              option_grade: z.number().int().positive(),
              option_effect: z.object({
                operator_type: z.string(),
                min_stat_value: z.number(),
                max_stat_value: z.number(),
              }),
            }),
          ),
        }),
      ),
    }),
  ),
});

export type CoreTypeRecord = z.infer<typeof coreTypeSchema>;

/** A core type to show, by id, with the slots it fits and any core it also takes. */
export interface CoreTypeChoice {
  readonly id: string;
  readonly slots?: readonly string[];
  /** A core item, by name less its grade, the game also takes for this type. */
  readonly alsoTakes?: string;
}

/**
 * The chosen core types, in order, each at every grade, lowest first: the core items it
 * takes and the options they can roll, each once (NEXON lists Defense Augmentation's
 * DEF twice per grade). A type `core-type.json` no longer has is left out.
 */
export function coreTypesFrom(
  choices: readonly CoreTypeChoice[],
  coreTypes: readonly CoreTypeRecord[],
  materials: readonly MaterialRecord[],
): CoreType[] {
  const materialsById = new Map(
    materials.map((material) => [material.consumable_material_id, material]),
  );
  const materialsByName = new Map(
    materials.map((material) => [material.consumable_material_name, material]),
  );
  const itemOf = (material: MaterialRecord | undefined): CoreItem[] =>
    material === undefined
      ? []
      : [
          {
            name: material.consumable_material_name,
            imageUrl: material.image_url,
          },
        ];
  return choices.flatMap((choice) => {
    const type = coreTypes.find((entry) => entry.core_type_id === choice.id);
    if (type === undefined) {
      return [];
    }
    const grades = type.core_option
      .flatMap((option) => option.detail)
      .map((detail, index): CoreGrade => {
        const options = new Map<string, CoreOption>();
        for (const option of detail.available_item_option) {
          if (!options.has(option.item_option)) {
            options.set(option.item_option, {
              name: option.item_option,
              operator: option.option_effect.operator_type,
              min: option.option_effect.min_stat_value,
              max: option.option_effect.max_stat_value,
            });
          }
        }
        const grade =
          detail.available_item_option.at(0)?.option_grade ?? index + 1;
        const item = detail.required_core_item;
        return {
          grade,
          cores: [
            ...itemOf(
              item?.meta_type === "consumable_material_id"
                ? materialsById.get(item.meta_id)
                : undefined,
            ),
            ...(choice.alsoTakes === undefined
              ? []
              : itemOf(
                  materialsByName.get(
                    `${choice.alsoTakes} ${romanGrade(grade)}`,
                  ),
                )),
          ],
          options: [...options.values()],
        };
      })
      .sort((a, b) => a.grade - b.grade);
    return [
      {
        id: choice.id,
        name: type.core_type,
        slots: choice.slots ?? [],
        grades,
      },
    ];
  });
}

let setsPromise: Promise<
  [readonly CoreTypeRecord[], readonly MaterialRecord[]]
> | null = null;

/** The chosen core types, read while pages are prerendered. */
export async function fetchCoreTypes(
  choices: readonly CoreTypeChoice[],
): Promise<CoreType[]> {
  // One fetch per build worker: every weapon page and the components index read it.
  setsPromise ??= Promise.all([
    fetchMetadataSet("core-type", coreTypeSchema),
    fetchMaterials(),
  ]);
  const [coreTypes, materials] = await setsPromise;
  return coreTypesFrom(choices, coreTypes, materials);
}
