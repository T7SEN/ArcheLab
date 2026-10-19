import "server-only";
import { basicMaterials } from "@/data/basic-materials";
import { miscellaneousItems } from "@/data/miscellaneous";
import {
  useKinds,
  type BasicMaterial,
  type MaterialUse,
} from "@/features/basic-materials/basic-filters";
import { withPlaceLinks } from "@/features/game-data/places";
import { slugOf } from "@/lib/slug";
import { fetchBuildTargets, type BuildTargets } from "./amorphous-index";
import { fetchPlaceHrefs } from "./place-links";
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
 * The Basic Materials index (T7SEN, 2026-10-18; ADR 0045): the 65 materials of the
 * game's Basic tab (`src/data/basic-materials.ts`), each with its art and where it drops
 * from `consumable-material.json`, and what it goes into from `research.json`.
 */

export interface BasicSets {
  readonly materials: readonly MaterialRecord[];
  readonly research: readonly ResearchRecord[];
  readonly acquisitions: readonly AcquisitionRecord[];
  /** Pages for drop places, by NEXON's place id (`place-links.ts`). */
  readonly placeHrefs?: ReadonlyMap<string, string>;
}

/**
 * Everything a material goes into: each Descendant, weapon, Fellow or vehicle researched
 * with it, or with the part it is researched into ("Hardener" makes a part of Bunny),
 * and each Enhancement Material researched with it. In `useKinds` order, then A–Z.
 */
export function usesOf(
  id: string,
  sets: Pick<BasicSets, "materials" | "research">,
  targets: BuildTargets,
): MaterialUse[] {
  const names = new Map(
    sets.materials.map((material) => [
      material.consumable_material_id,
      material.consumable_material_name,
    ]),
  );
  const usedIn = (input: string) =>
    sets.research.filter((entry) =>
      entry.research_material.some((material) => material.meta_id === input),
    );
  const found = new Map<string, MaterialUse>();
  const add = (use: MaterialUse) => {
    found.set(`${use.kind}:${use.slug}`, use);
  };
  for (const entry of usedIn(id)) {
    for (const result of entry.research_result) {
      const direct = targets.get(result.meta_id);
      const name = names.get(result.meta_id);
      if (direct !== undefined) {
        add(direct);
      } else if (
        entry.research_type === "UpgradeMaterial" &&
        name !== undefined
      ) {
        // The Enhancement Materials page lists every UpgradeMaterial research (ADR 0043).
        add({ kind: "enhancement", slug: slugOf(name), name });
      } else {
        // A part: what that part is researched into.
        for (const next of usedIn(result.meta_id)) {
          for (const made of next.research_result) {
            const build = targets.get(made.meta_id);
            if (build !== undefined) {
              add(build);
            }
          }
        }
      }
    }
  }
  const rank = (use: MaterialUse) =>
    useKinds.findIndex((entry) => entry.kind === use.kind);
  return [...found.values()].sort(
    (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name),
  );
}

/**
 * Each basic material in the game's order, with what it goes into and where it drops.
 * One NEXON no longer lists is left out.
 */
export function basicMaterialIndex(
  sets: BasicSets,
  targets: BuildTargets,
): BasicMaterial[] {
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
  return basicMaterials.flatMap((facts): BasicMaterial[] => {
    const material = materials.get(facts.id);
    if (material === undefined) {
      return [];
    }
    const name = material.consumable_material_name;
    return [
      {
        slug: slugOf(name),
        name,
        tier: facts.tier,
        description: facts.description,
        imageUrl: material.image_url,
        uses: usesOf(facts.id, sets, targets),
        sources: [
          ...new Set(
            material.acquisition_detail.flatMap((source) => {
              const place = places.get(source);
              return place === undefined ? [] : [place];
            }),
          ),
        ],
        ...withPlaceLinks(material.acquisition_detail, places, sets.placeHrefs),
        ...(miscNames.has(name) ? { miscTwin: slugOf(name) } : {}),
      },
    ];
  });
}

/**
 * The Miscellaneous items' names: four are a Basic Material's too (Xeno Fluid and
 * others, Breach Tracking rewards), and the two link each other (ADR 0050).
 */
const miscNames: ReadonlySet<string> = new Set(
  miscellaneousItems.map((item) => item.name),
);

let indexPromise: Promise<BasicMaterial[]> | null = null;

/** Every basic material, fetched once per build worker; none when NEXON can't be reached. */
export function fetchBasicMaterials(): Promise<BasicMaterial[]> {
  indexPromise ??= Promise.all([
    fetchMaterials(),
    fetchResearch(),
    fetchAcquisitions(),
    fetchBuildTargets(),
    fetchPlaceHrefs(),
  ]).then(([materials, research, acquisitions, targets, placeHrefs]) =>
    basicMaterialIndex(
      { materials, research, acquisitions, placeHrefs },
      targets,
    ),
  );
  return indexPromise;
}
