import "server-only";
import {
  enhancementMaterials,
  ingredientCounts,
} from "@/data/enhancement-materials";
import type { EnhancementMaterial } from "@/features/enhancement/enhancement-filters";
import { withPlaceLinks } from "@/features/game-data/places";
import { slugOf } from "@/lib/slug";
import { fetchPlaceHrefs } from "./place-links";
import { recipeFor, type Recipe } from "./recipe";
import {
  fetchAcquisitions,
  fetchMaterials,
  fetchResearch,
  sourceText,
  type AcquisitionRecord,
  type MaterialRecord,
  type ResearchRecord,
} from "./shared-sets";

/**
 * The Enhancement Materials index (T7SEN, 2026-10-17; ADR 0043): every item NEXON's
 * `research.json` makes with `UpgradeMaterial` research (33 recipes for 23 items on
 * 2026-10-17, the game's Research screen's Enhancement tab), with each way to research
 * it, where it also drops, and its tier and description from `src/data`.
 */

export interface EnhancementSets {
  readonly research: readonly ResearchRecord[];
  readonly materials: readonly MaterialRecord[];
  readonly acquisitions: readonly AcquisitionRecord[];
  /** Pages for drop places, by NEXON's place id (`place-links.ts`). */
  readonly placeHrefs?: ReadonlyMap<string, string>;
}

/**
 * NEXON's "Obtainable through Research" place: every item here is researched, and the
 * details already show how, so it isn't listed among the places it also drops.
 */
const researchPlace = "RS";

/** A recipe with the game's counts where they differ from NEXON's (`ingredientCounts`). */
function withGameCounts(recipe: Recipe, result: string): Recipe {
  return {
    ...recipe,
    items: recipe.items.map((item) => {
      const counted = ingredientCounts.find(
        (entry) => entry.result === result && entry.ingredient === item.name,
      );
      return counted === undefined ? item : { ...item, count: counted.count };
    }),
  };
}

/**
 * Each item with its recipes, in the game's order (`enhancementMaterials`), then any
 * NEXON adds later, A–Z. An item whose material NEXON doesn't list is left out.
 */
export function enhancementIndex(sets: EnhancementSets): EnhancementMaterial[] {
  const materials = new Map(
    sets.materials.map((material) => [
      material.consumable_material_id,
      material,
    ]),
  );
  const places = new Map(
    sets.acquisitions.map((place) => [
      place.acquisition_detail_id,
      sourceText(place.acquisition_detail_name),
    ]),
  );
  const byResult = new Map<string, ResearchRecord[]>();
  for (const research of sets.research) {
    const result = research.research_result.find(
      (entry) => entry.meta_type === "consumable_material_id",
    );
    if (research.research_type !== "UpgradeMaterial" || result === undefined) {
      continue;
    }
    byResult.set(result.meta_id, [
      ...(byResult.get(result.meta_id) ?? []),
      research,
    ]);
  }
  const order = (name: string) => {
    const index = enhancementMaterials.findIndex((item) => item.name === name);
    return index === -1 ? enhancementMaterials.length : index;
  };
  return [...byResult]
    .flatMap(([id, researches]): EnhancementMaterial[] => {
      const material = materials.get(id);
      if (material === undefined) {
        return [];
      }
      const name = material.consumable_material_name;
      const facts = enhancementMaterials.find((item) => item.name === name);
      const recipes = researches.flatMap((research) => {
        const recipe = recipeFor(research, sets);
        return recipe === null ? [] : [withGameCounts(recipe, name)];
      });
      return recipes.length === 0
        ? []
        : [
            {
              slug: slugOf(name),
              name,
              tier: facts?.tier ?? null,
              description: facts?.description ?? "",
              imageUrl: material.image_url,
              recipes,
              sources: [
                ...new Set(
                  material.acquisition_detail.flatMap((source) => {
                    const place = places.get(source);
                    return place === undefined || source === researchPlace
                      ? []
                      : [place];
                  }),
                ),
              ],
              ...withPlaceLinks(
                material.acquisition_detail,
                places,
                sets.placeHrefs,
              ),
            },
          ];
    })
    .sort(
      (a, b) => order(a.name) - order(b.name) || a.name.localeCompare(b.name),
    );
}

let indexPromise: Promise<EnhancementMaterial[]> | null = null;

/** Every enhancement material, fetched once per build worker; none when NEXON can't be reached. */
export function fetchEnhancementMaterials(): Promise<EnhancementMaterial[]> {
  indexPromise ??= Promise.all([
    fetchResearch(),
    fetchMaterials(),
    fetchAcquisitions(),
    fetchPlaceHrefs(),
  ]).then(([research, materials, acquisitions, placeHrefs]) =>
    enhancementIndex({ research, materials, acquisitions, placeHrefs }),
  );
  return indexPromise;
}
