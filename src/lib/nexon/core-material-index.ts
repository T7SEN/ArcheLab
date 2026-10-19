import "server-only";
import { coreMaterialTier } from "@/data/core-materials";
import type { AmorphousPattern } from "@/features/amorphous/amorphous-filters";
import type {
  CoreMaterial,
  CoreMaterialPattern,
} from "@/features/core-materials/core-material-filters";
import { withPlaceLinks } from "@/features/game-data/places";
import { slugOf } from "@/lib/slug";
import { fetchPlaceHrefs } from "./place-links";
import {
  fetchAmorphousPatterns,
  fetchBuildTargets,
  type BuildTargets,
} from "./amorphous-index";
import { usesOf } from "./basic-material-index";
import { coreMaterialIds } from "./material-links";
import { recipeFor } from "./recipe";
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
 * The Core Materials index (T7SEN, 2026-10-18; ADR 0047): every part NEXON's research
 * data takes to make a Descendant, weapon, Fellow, vehicle or Enhancement Material
 * (`coreMaterialIds`), with its tier (`src/data/core-materials.ts`), what it goes into,
 * how it is researched, the Amorphous Material Patterns in the game that give it, and
 * where else it drops.
 */

export interface CoreMaterialSets {
  readonly materials: readonly MaterialRecord[];
  readonly research: readonly ResearchRecord[];
  readonly acquisitions: readonly AcquisitionRecord[];
  /** Pages for drop places, by NEXON's place id (`place-links.ts`). */
  readonly placeHrefs?: ReadonlyMap<string, string>;
}

/** How an `acquisition_detail` id naming an Amorphous Material Pattern starts: `AM:<id>`. */
const patternSource = "AM:";

/** NEXON's "Obtainable through Research": the details already show how it's researched. */
const researchPlace = "RS";

/**
 * Each Core Material, highest tier first, then A–Z. The patterns that give it come from
 * the Amorphous Materials index, so only patterns still in the game show; the pattern
 * ids in its drop places are left out for that reason.
 */
export function coreMaterialIndex(
  sets: CoreMaterialSets,
  targets: BuildTargets,
  patterns: readonly AmorphousPattern[],
): CoreMaterial[] {
  const places = new Map(
    sets.acquisitions.map((place) => [
      place.acquisition_detail_id,
      sourceText(place.acquisition_detail_name),
    ]),
  );
  const givenBy = new Map<string, CoreMaterialPattern[]>();
  for (const pattern of patterns) {
    for (const reward of pattern.rewards) {
      givenBy.set(reward.id, [
        ...(givenBy.get(reward.id) ?? []),
        { slug: pattern.slug, name: pattern.name, rate: reward.rate },
      ]);
    }
  }
  const ids = coreMaterialIds(sets.research, sets.materials);
  return sets.materials
    .filter((material) => ids.has(material.consumable_material_id))
    .map((material): CoreMaterial => {
      const id = material.consumable_material_id;
      const own = sets.research.find((entry) =>
        entry.research_result.some(
          (result) =>
            result.meta_type === "consumable_material_id" &&
            result.meta_id === id,
        ),
      );
      return {
        slug: slugOf(material.consumable_material_name),
        name: material.consumable_material_name,
        tier: coreMaterialTier(id),
        imageUrl: material.image_url,
        uses: usesOf(id, sets, targets),
        recipe: recipeFor(own, sets, 1),
        patterns: [...(givenBy.get(id) ?? [])].sort(
          (a, b) => b.rate - a.rate || a.name.localeCompare(b.name),
        ),
        sources: [
          ...new Set(
            material.acquisition_detail.flatMap((source) => {
              const place = places.get(source);
              return place === undefined ||
                source.startsWith(patternSource) ||
                source === researchPlace
                ? []
                : [place];
            }),
          ),
        ],
        ...withPlaceLinks(material.acquisition_detail, places, sets.placeHrefs),
      };
    })
    .sort(
      (a, b) =>
        b.tier.localeCompare(a.tier, "en", { numeric: true }) ||
        a.name.localeCompare(b.name, "en", { numeric: true }),
    );
}

let indexPromise: Promise<CoreMaterial[]> | null = null;

/** Every Core Material, fetched once per build worker; none when NEXON can't be reached. */
export function fetchCoreMaterials(): Promise<CoreMaterial[]> {
  indexPromise ??= Promise.all([
    fetchMaterials(),
    fetchResearch(),
    fetchAcquisitions(),
    fetchBuildTargets(),
    fetchAmorphousPatterns(),
    fetchPlaceHrefs(),
  ]).then(
    ([materials, research, acquisitions, targets, amorphous, placeHrefs]) =>
      coreMaterialIndex(
        { materials, research, acquisitions, placeHrefs },
        targets,
        amorphous.patterns,
      ),
  );
  return indexPromise;
}
