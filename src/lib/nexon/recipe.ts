import "server-only";
import type { MaterialRecord, ResearchRecord } from "./shared-sets";

/**
 * Research recipes from NEXON's `research.json` and `consumable-material.json`, shared by
 * the Descendant and weapon pages (ADR 0023, ADR 0024).
 */

export interface RecipeItem {
  readonly name: string;
  readonly imageUrl: string;
  readonly count: number;
  /** How the item itself is researched, when NEXON lists a recipe for it. */
  readonly recipe: Recipe | null;
  /** Amorphous Materials it comes from, when its acquisition names one. */
  readonly from: readonly {
    readonly name: string;
    readonly imageUrl: string;
  }[];
}

export interface Recipe {
  /** How long the research takes, in seconds. */
  readonly time: number;
  /** The research's currency costs, such as Gold. */
  readonly costs: readonly {
    readonly currency: string;
    readonly value: number;
  }[];
  readonly items: readonly RecipeItem[];
}

/** The sets a recipe reads. */
export interface ResearchSets {
  readonly research: readonly ResearchRecord[];
  readonly materials: readonly MaterialRecord[];
}

/**
 * The research of a type whose result is the given item: `Character` research making a
 * `descendant_id`, or `Equipment` research making a `weapon_id`.
 */
export function researchFor(
  research: readonly ResearchRecord[],
  type: string,
  metaType: string,
  metaId: string,
): ResearchRecord | undefined {
  return research.find(
    (recipe) =>
      recipe.research_type === type &&
      recipe.research_result.some(
        (result) => result.meta_type === metaType && result.meta_id === metaId,
      ),
  );
}

/** A research's recipe, following its parts down to their own recipes. */
export function recipeFor(
  research: ResearchRecord | undefined,
  sets: ResearchSets,
  depth = 0,
): Recipe | null {
  if (research === undefined) {
    return null;
  }
  const materials = new Map(
    sets.materials.map((material) => [
      material.consumable_material_id,
      material,
    ]),
  );
  const items = research.research_material.flatMap((input): RecipeItem[] => {
    const material = materials.get(input.meta_id);
    if (
      input.meta_type !== "consumable_material_id" ||
      material === undefined
    ) {
      return [];
    }
    // Parts are researched too: one level down is the deepest NEXON's recipes go.
    const ownRecipe =
      depth > 0
        ? undefined
        : sets.research.find((entry) =>
            entry.research_result.some(
              (result) =>
                result.meta_type === "consumable_material_id" &&
                result.meta_id === input.meta_id,
            ),
          );
    const from = material.acquisition_detail.flatMap((source) => {
      const amorphous = /^AM:(\d+)$/.exec(source)?.[1];
      const pattern =
        amorphous === undefined ? undefined : materials.get(amorphous);
      return pattern === undefined
        ? []
        : [
            {
              name: pattern.consumable_material_name,
              imageUrl: pattern.image_url,
            },
          ];
    });
    return [
      {
        name: material.consumable_material_name,
        imageUrl: material.image_url,
        count: input.material_count,
        recipe: recipeFor(ownRecipe, sets, depth + 1),
        from,
      },
    ];
  });
  return {
    time: research.research_time,
    costs: research.research_cost.map((cost) => ({
      currency: cost.currency_type,
      value: cost.currency_value,
    })),
    items,
  };
}
