import "server-only";
import { basicMaterials } from "@/data/basic-materials";
import { miscellaneousItems } from "@/data/miscellaneous";
import type { MiscItem } from "@/features/miscellaneous/misc-filters";
import { withPlaceLinks } from "@/features/game-data/places";
import { slugOf } from "@/lib/slug";
import { fetchPlaceHrefs } from "./place-links";
import {
  fetchAcquisitions,
  fetchMaterials,
  sourceText,
  type AcquisitionRecord,
  type MaterialRecord,
} from "./shared-sets";

/**
 * The Miscellaneous index (T7SEN, 2026-10-18; ADR 0050): the items of NEXON's Library's
 * Miscellaneous list (`src/data/miscellaneous.ts`), each with its art and where it drops
 * from `consumable-material.json`. None goes into any research. Places with a page of
 * their own link it, and four items link the Basic Material of the same name.
 */

export interface MiscSets {
  readonly materials: readonly MaterialRecord[];
  readonly acquisitions: readonly AcquisitionRecord[];
  /** Pages for drop places, by NEXON's place id (`place-links.ts`). */
  readonly placeHrefs?: ReadonlyMap<string, string>;
}

/** The Basic Materials' addresses by name (T7SEN, 2026-10-18). */
const basicByName: ReadonlyMap<string, string> = new Map(
  basicMaterials.map((material) => [material.name, slugOf(material.name)]),
);

/**
 * Each item in the Library's order. An item of several boxes (Transcendent Weapon Loot)
 * has every box's drop places, and the art of the box found in the most places; one
 * NEXON no longer lists is left out.
 */
export function miscellaneousIndex(sets: MiscSets): MiscItem[] {
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
  return miscellaneousItems.flatMap((facts): MiscItem[] => {
    const boxes = facts.ids.flatMap((id) => {
      const material = materials.get(id);
      return material === undefined ? [] : [material];
    });
    const shown = [...boxes]
      .sort((a, b) => b.acquisition_detail.length - a.acquisition_detail.length)
      .at(0);
    if (shown === undefined) {
      return [];
    }
    const name = shown.consumable_material_name;
    return [
      {
        slug: slugOf(name),
        name,
        tier: facts.tier,
        imageUrl: shown.image_url,
        sources: [
          ...new Set(
            boxes.flatMap((box) =>
              box.acquisition_detail.flatMap((source) => {
                const place = places.get(source);
                return place === undefined ? [] : [place];
              }),
            ),
          ),
        ],
        placeLinks:
          withPlaceLinks(
            boxes.flatMap((box) => box.acquisition_detail),
            places,
            sets.placeHrefs,
          ).placeLinks ?? {},
        gives: facts.gives ?? null,
        basicTwin: basicByName.get(name) ?? null,
      },
    ];
  });
}

let indexPromise: Promise<MiscItem[]> | null = null;

/** Every Miscellaneous item, fetched once per build worker; none when NEXON can't be reached. */
export function fetchMiscellaneous(): Promise<MiscItem[]> {
  indexPromise ??= Promise.all([
    fetchMaterials(),
    fetchAcquisitions(),
    fetchPlaceHrefs(),
  ]).then(([materials, acquisitions, placeHrefs]) =>
    miscellaneousIndex({ materials, acquisitions, placeHrefs }),
  );
  return indexPromise;
}
