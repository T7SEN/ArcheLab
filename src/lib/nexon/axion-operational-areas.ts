import "server-only";
import { axionMissions } from "@/data/axion-operational-areas";
import { transcendentDrops } from "@/data/transcendent-weapon-sources";
import type { AxionMission } from "@/features/axion/mission-filters";
import type { Drop400 } from "@/features/infiltration-400/operation-filters";
import { slugOf } from "@/lib/slug";
import { fetchItemHrefs } from "./difficulty-rewards";
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
 * The Axion Operational Areas page (ADR 0052): the seven Axion Plains Operational Area
 * missions in the drop places (`acquisition-detail.json`: "[Axion Plains] [Hard] -
 * [First Crater] complete", and its "Mission Monster"), what drops there
 * (`consumable-material.json`), the Amorphous Material Pattern each one's completion
 * gives, and its Transcendent weapon chance from Update 1.4.0's table. Which two are
 * active is `src/data/axion-operational-areas.ts`.
 */

export interface AxionSets {
  readonly acquisitions: readonly AcquisitionRecord[];
  readonly materials: readonly MaterialRecord[];
  readonly research: readonly ResearchRecord[];
  /** Pages for drops that aren't Basic or Core Materials, by item name. */
  readonly itemHrefs: ReadonlyMap<string, string>;
}

/** An Axion place as the game names it: "[Axion Plains] [Hard] - [First Crater] complete". */
const placePattern = /^\[Axion Plains\] \[Hard\] - \[(.+)\] (.+)$/;

/** The ways an item comes, in the game's order, then any other A–Z. */
const wayOrder = ["complete", "Mission Monster"];

const patternPrefix = "Amorphous Material Pattern: ";

/** A drop place's mission and way, when it is one of the seven missions. */
function placeOf(
  record: AcquisitionRecord,
): { readonly name: string; readonly way: string } | null {
  const match = placePattern.exec(sourceText(record.acquisition_detail_name));
  const name = match?.[1];
  const way = match?.[2];
  return name !== undefined && way !== undefined && axionMissions.includes(name)
    ? { name, way }
    : null;
}

/**
 * Each mission's drop places, by NEXON id, with its address ("first-crater"): the pages
 * that list where an item drops link these here (ADR 0050, ADR 0052).
 */
export function axionPlaces(
  acquisitions: readonly AcquisitionRecord[],
): Map<string, string> {
  const found = new Map<string, string>();
  for (const record of acquisitions) {
    const place = placeOf(record);
    if (place !== null) {
      found.set(record.acquisition_detail_id, slugOf(place.name));
    }
  }
  return found;
}

/** Pure, for the tests: the seven missions in the order the cycle first names them. */
export function axionOperationalAreas(sets: AxionSets): AxionMission[] {
  const places = new Map<string, { name: string; way: string }>();
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
      const name = material.consumable_material_name;
      const items = drops.get(place.name) ?? new Map<string, Set<string>>();
      items.set(name, (items.get(name) ?? new Set()).add(place.way));
      drops.set(place.name, items);
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
  const named = new Set([...places.values()].map((place) => place.name));
  return axionMissions.flatMap((name): AxionMission[] => {
    if (!named.has(name)) {
      console.warn(
        `Axion Operational Areas: the cycle names "${name}", which has no drop places.`,
      );
      return [];
    }
    const items = [...(drops.get(name) ?? new Map<string, Set<string>>())]
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
    // The pattern its completion gives: the missions each give a different one.
    const pattern = items.find(
      (item) =>
        item.name.startsWith(patternPrefix) && item.ways.includes("complete"),
    );
    const transcendent = transcendentDrops.find((row) => row.content === name);
    return [
      {
        slug: slugOf(name),
        name,
        pattern:
          pattern === undefined
            ? null
            : {
                name: pattern.name,
                imageUrl: pattern.imageUrl,
                href: pattern.href,
              },
        transcendent:
          transcendent === undefined
            ? null
            : {
                chance: transcendent.chance,
                min: transcendent.quality.min,
                max: transcendent.quality.max,
              },
        drops: items,
      },
    ];
  });
}

let indexPromise: Promise<AxionMission[]> | null = null;

/** The page's missions, fetched once per build worker. */
export function fetchAxionOperationalAreas(): Promise<AxionMission[]> {
  indexPromise ??= Promise.all([
    fetchAcquisitions(),
    fetchMaterials(),
    fetchResearch(),
    fetchItemHrefs(),
  ]).then(([acquisitions, materials, research, itemHrefs]) =>
    axionOperationalAreas({ acquisitions, materials, research, itemHrefs }),
  );
  return indexPromise;
}
