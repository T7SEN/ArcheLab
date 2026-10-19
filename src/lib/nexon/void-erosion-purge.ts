import "server-only";
import {
  purgeCycle,
  purgeMapArt,
  purgeMapArtSize,
} from "@/data/void-erosion-purge";
import type { Drop400 } from "@/features/infiltration-400/operation-filters";
import {
  stageSlug,
  type PurgeDifficulty,
  type PurgeMap,
  type PurgeStage,
} from "@/features/void-erosion-purge/purge-filters";
import { slugOf } from "@/lib/slug";
import { fetchItemHrefs, fetchRewardMapNames } from "./difficulty-rewards";
import { materialHref } from "./material-links";
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
 * The Void Erosion Purge page (ADR 0053): Stage 10's five maps (`src/data/void-erosion-
 * purge.ts`), checked against the names in NEXON's reward list, and each stage of
 * Normal and Challenge in the drop places (`acquisition-detail.json`: "[Void Erosion
 * Purge] [Normal] - [Stage 10]", and its "Mission Monster"), with what drops there
 * (`consumable-material.json`).
 */

export interface PurgeSets {
  readonly acquisitions: readonly AcquisitionRecord[];
  readonly materials: readonly MaterialRecord[];
  readonly research: readonly ResearchRecord[];
  /** Pages for drops that aren't Basic or Core Materials, by item name. */
  readonly itemHrefs: ReadonlyMap<string, string>;
  /** The map names in NEXON's reward list; empty when it didn't load. */
  readonly mapNames: ReadonlySet<string>;
}

export interface VoidErosionPurge {
  /** In the cycle's order. */
  readonly maps: readonly PurgeMap[];
  /** Normal's stages, then Challenge's, each from Stage 1. */
  readonly stages: readonly PurgeStage[];
}

/** A stage's place as the game names it: "[Void Erosion Purge] [Normal] - [Stage 10]". */
const placePattern =
  /^\[Void Erosion Purge\] \[(Normal|Challenge)\] - \[Stage (\d+)\](?: (.+))?$/;

/**
 * The ways an item comes, then any other A–Z. A stage's completion place has no word
 * after its name; it is "complete", as the other places' are.
 */
const wayOrder = ["complete", "Mission Monster"];

const difficultyOrder: readonly PurgeDifficulty[] = ["Normal", "Challenge"];

interface StagePlace {
  readonly difficulty: PurgeDifficulty;
  readonly stage: number;
  readonly way: string;
}

/** A drop place's stage and way, when it is a Void Erosion Purge stage. */
function placeOf(record: AcquisitionRecord): StagePlace | null {
  const match = placePattern.exec(sourceText(record.acquisition_detail_name));
  const difficulty = match?.[1];
  const stage = Number(match?.[2]);
  if (
    (difficulty !== "Normal" && difficulty !== "Challenge") ||
    !Number.isInteger(stage)
  ) {
    return null;
  }
  return { difficulty, stage, way: match?.[3] ?? "complete" };
}

/**
 * Each stage's drop places, by NEXON id, with its address ("normal-10"): the pages that
 * list where an item drops link these here (ADR 0050, ADR 0053).
 */
export function purgePlaces(
  acquisitions: readonly AcquisitionRecord[],
): Map<string, string> {
  const found = new Map<string, string>();
  for (const record of acquisitions) {
    const place = placeOf(record);
    if (place !== null) {
      found.set(
        record.acquisition_detail_id,
        stageSlug(place.difficulty, place.stage),
      );
    }
  }
  return found;
}

/** Stage 10's five maps, with their art; a name the reward list lacks warns. */
export function purgeMaps(mapNames: ReadonlySet<string>): PurgeMap[] {
  return purgeCycle.map((name, index): PurgeMap => {
    if (mapNames.size > 0 && !mapNames.has(name)) {
      console.warn(
        `Void Erosion Purge: "${name}" isn't a map name in NEXON's reward list.`,
      );
    }
    const size = purgeMapArtSize[name];
    return {
      slug: slugOf(name),
      name,
      position: index + 1,
      imageUrl: purgeMapArt[name] ?? "",
      width: size?.width ?? 0,
      height: size?.height ?? 0,
    };
  });
}

/** Pure, for the tests: the maps, and every stage found in the drop places. */
export function voidErosionPurge(sets: PurgeSets): VoidErosionPurge {
  const places = new Map<string, StagePlace>();
  for (const record of sets.acquisitions) {
    const place = placeOf(record);
    if (place !== null) {
      places.set(record.acquisition_detail_id, place);
    }
  }

  const drops = new Map<string, Map<string, Set<string>>>();
  const hrefs = new Map<string, string | null>();
  const art = new Map<
    string,
    { readonly imageUrl: string; readonly core: boolean }
  >();
  for (const material of sets.materials) {
    for (const id of material.acquisition_detail) {
      const place = places.get(id);
      if (place === undefined) {
        continue;
      }
      const slug = stageSlug(place.difficulty, place.stage);
      const name = material.consumable_material_name;
      const items = drops.get(slug) ?? new Map<string, Set<string>>();
      items.set(name, (items.get(name) ?? new Set()).add(place.way));
      drops.set(slug, items);
      art.set(name, {
        imageUrl: material.image_url,
        core: material.material_type === "CoreItem",
      });
      if (!hrefs.has(name)) {
        hrefs.set(
          name,
          materialHref(material.consumable_material_id, name, sets) ??
            sets.itemHrefs.get(name) ??
            null,
        );
      }
    }
  }

  const wayRank = (way: string) => {
    const at = wayOrder.indexOf(way);
    return at === -1 ? wayOrder.length : at;
  };
  const stages = new Map<
    string,
    { difficulty: PurgeDifficulty; stage: number }
  >();
  for (const place of places.values()) {
    stages.set(stageSlug(place.difficulty, place.stage), place);
  }
  return {
    maps: purgeMaps(sets.mapNames),
    stages: [...stages]
      .sort(
        ([, a], [, b]) =>
          difficultyOrder.indexOf(a.difficulty) -
            difficultyOrder.indexOf(b.difficulty) || a.stage - b.stage,
      )
      .map(([slug, { difficulty, stage }]): PurgeStage => {
        const items = [...(drops.get(slug) ?? new Map<string, Set<string>>())]
          .map(([item, ways]): Drop400 => ({
            name: item,
            imageUrl: art.get(item)?.imageUrl ?? "",
            kind: art.get(item)?.core === true ? "core" : "material",
            href: hrefs.get(item) ?? null,
            ways: [...ways].sort(
              (a, b) => wayRank(a) - wayRank(b) || a.localeCompare(b),
            ),
          }))
          // Materials, then cores, each A–Z.
          .sort(
            (a, b) =>
              Number(a.kind === "core") - Number(b.kind === "core") ||
              a.name.localeCompare(b.name, "en", { numeric: true }),
          );
        return { slug, difficulty, stage, drops: items };
      }),
  };
}

let indexPromise: Promise<VoidErosionPurge> | null = null;

/** The page's maps and stages, fetched once per build worker. */
export function fetchVoidErosionPurge(): Promise<VoidErosionPurge> {
  indexPromise ??= Promise.all([
    fetchAcquisitions(),
    fetchMaterials(),
    fetchResearch(),
    fetchItemHrefs(),
    fetchRewardMapNames(),
  ]).then(([acquisitions, materials, research, itemHrefs, mapNames]) =>
    voidErosionPurge({
      acquisitions,
      materials,
      research,
      itemHrefs,
      mapNames,
    }),
  );
  return indexPromise;
}
