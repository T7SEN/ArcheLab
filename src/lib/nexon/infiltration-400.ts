import "server-only";
import { cycle400, outside400Cycle } from "@/data/infiltration-400";
import { transcendentDrops } from "@/data/transcendent-weapon-sources";
import type {
  Drop400,
  Operation400,
} from "@/features/infiltration-400/operation-filters";
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
 * The 400% Infiltration Operations page (ADR 0049): every Infiltration Operation that
 * has a 400% difficulty in the drop places (`acquisition-detail.json`, ids ending
 * `:Hard_400`; 13 on 2026-10-18), what drops there (`consumable-material.json`), and
 * its Transcendent weapon chance from Update 1.4.0's table. Which two are 400% each day
 * is `src/data/infiltration-400.ts`.
 */

export interface Infiltration400Sets {
  readonly acquisitions: readonly AcquisitionRecord[];
  readonly materials: readonly MaterialRecord[];
  readonly research: readonly ResearchRecord[];
  /** Pages for drops that aren't Basic or Core Materials, by item name. */
  readonly itemHrefs: ReadonlyMap<string, string>;
}

/** The regions in Update 1.4.0's table order, as the drop places write them. */
const regionOrder = [
  "Kingston",
  "Sterile Land",
  "Vespers",
  "Echo Swamp",
  "Agna Desert",
  "White-night Gulch",
  "Hagios",
  "Fortress",
];

/** A 400% place as the game names it: "[Vespers] [Hard] - [The Shelter] complete". */
const placePattern = /^\[([^\]]+)\] \[Hard\] - \[(.+)\] (.+)$/;
const idPattern = /^M[SM]:DungeonField:\d{9}:Hard_400$/;

/** The ways an item comes, in the game's order, then any other A–Z. */
const wayOrder = ["complete", "Mission Monster"];

/** A name without a leading "The", lowercase: the notes write "Asylum" for "The Asylum". */
const bare = (name: string) => name.replace(/^The /, "").toLowerCase();

/**
 * Each 400% drop place, by its NEXON id, with its operation's address ("the-shelter"):
 * the Miscellaneous page links an item's places here (ADR 0050). Its names say
 * "[Hard]", as the Hard ones' do, so only the id tells them apart.
 */
export function operation400Places(
  acquisitions: readonly AcquisitionRecord[],
): Map<string, string> {
  const found = new Map<string, string>();
  for (const record of acquisitions) {
    const name = idPattern.test(record.acquisition_detail_id)
      ? placePattern.exec(sourceText(record.acquisition_detail_name))?.[2]
      : undefined;
    if (name !== undefined) {
      found.set(record.acquisition_detail_id, slugOf(name));
    }
  }
  return found;
}

/** Pure, for the tests: every operation with a 400% difficulty, in region order. */
export function infiltration400(sets: Infiltration400Sets): Operation400[] {
  const places = new Map<
    string,
    { readonly region: string; readonly name: string; readonly way: string }
  >();
  for (const record of sets.acquisitions) {
    if (!idPattern.test(record.acquisition_detail_id)) {
      continue;
    }
    const match = placePattern.exec(sourceText(record.acquisition_detail_name));
    if (match === null) {
      console.warn(
        `400% Infiltration Operations: can't read "${record.acquisition_detail_name}".`,
      );
      continue;
    }
    const [, region = "", name = "", way = ""] = match;
    places.set(record.acquisition_detail_id, { region, name, way });
  }

  const drops = new Map<string, Map<string, Set<string>>>();
  const hrefs = new Map<string, string | null>();
  const art = new Map<
    string,
    { readonly imageUrl: string; readonly core: boolean }
  >();
  for (const place of places.values()) {
    drops.set(
      place.name,
      drops.get(place.name) ?? new Map<string, Set<string>>(),
    );
  }
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
  const regionRank = (region: string) => {
    const at = regionOrder.indexOf(region);
    return at === -1 ? regionOrder.length : at;
  };
  const named = new Map(
    [...places.values()].map((place) => [place.name, place.region]),
  );
  const inCycle = new Set(cycle400.flat());
  for (const name of inCycle) {
    if (!named.has(name)) {
      console.warn(
        `400% Infiltration Operations: the cycle names "${name}", which has no 400% places.`,
      );
    }
  }
  const operations = [...named]
    .map(([name, region]): Operation400 => {
      const transcendent = transcendentDrops.find(
        (row) =>
          row.content.endsWith(" - Hard 400%") &&
          bare(row.content.slice(0, -" - Hard 400%".length)) === bare(name),
      );
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
      if (!inCycle.has(name) && !outside400Cycle.includes(name)) {
        console.warn(
          `400% Infiltration Operations: "${name}" has 400% places but isn't in the cycle.`,
        );
      }
      return {
        slug: slugOf(name),
        name,
        region,
        transcendent:
          transcendent === undefined
            ? null
            : {
                chance: transcendent.chance,
                min: transcendent.quality.min,
                max: transcendent.quality.max,
              },
        inCycle: inCycle.has(name),
        drops: items,
      };
    })
    .sort((a, b) => regionRank(a.region) - regionRank(b.region));
  return operations;
}

let indexPromise: Promise<Operation400[]> | null = null;

/** The page's operations, fetched once per build worker. */
export function fetchInfiltration400(): Promise<Operation400[]> {
  indexPromise ??= Promise.all([
    fetchAcquisitions(),
    fetchMaterials(),
    fetchResearch(),
    fetchItemHrefs(),
  ]).then(([acquisitions, materials, research, itemHrefs]) =>
    infiltration400({ acquisitions, materials, research, itemHrefs }),
  );
  return indexPromise;
}
