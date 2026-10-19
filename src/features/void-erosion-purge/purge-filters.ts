/**
 * The Void Erosion Purge page's data shapes and URL query (ADR 0053): pure, so the page
 * and the unit tests share them. The chosen map and stage live in the URL query;
 * defaults stay out of it. A stage's drops are shaped as the 400% Infiltration
 * Operations page's (ADR 0049), whose reward list the page shares.
 */

import type { Drop400 } from "@/features/infiltration-400/operation-filters";

/** One of Stage 10's five maps. */
export interface PurgeMap {
  /** "eroded-ancestors-ruins"; unique. */
  readonly slug: string;
  /** As the game writes it: "Eroded Ancestors Ruins". */
  readonly name: string;
  /** Its place in the cycle, from 1. */
  readonly position: number;
  /** Its picture on the site, or "" with none. */
  readonly imageUrl: string;
  readonly width: number;
  readonly height: number;
}

export type PurgeDifficulty = "Normal" | "Challenge";

/** A stage of Normal (1 to 10) or Challenge (1 to 5), with what it gives. */
export interface PurgeStage {
  /** "normal-10"; unique. */
  readonly slug: string;
  readonly difficulty: PurgeDifficulty;
  readonly stage: number;
  /** "complete" first, then "Mission Monster"; cores and materials, each A to Z. */
  readonly drops: readonly Drop400[];
}

export interface PurgeFilters {
  /** The map whose panel is open, by its address; null is today's. */
  readonly map: string | null;
  /** The stage whose rewards are open, by its address; null is Normal Stage 10. */
  readonly stage: string | null;
}

export const defaultPurgeFilters: PurgeFilters = { map: null, stage: null };

const keys = { map: "map", stage: "stage" } as const;

/** The stage that opens first: Normal Stage 10, the one whose map changes. */
export const defaultStage = "normal-10";

/** A stage's address: "normal-10". */
export function stageSlug(difficulty: PurgeDifficulty, stage: number): string {
  return `${difficulty.toLowerCase()}-${String(stage)}`;
}

/** The days the schedule shows around today: yesterday, then today and five more. */
export const scheduleFrom = -1;
export const scheduleTo = 5;

/** Filters from a URL query string. A map or stage the page doesn't have is ignored. */
export function parsePurgeFilters(
  search: string,
  offered: {
    readonly maps: readonly string[];
    readonly stages: readonly string[];
  },
): PurgeFilters {
  const params = new URLSearchParams(search);
  const map = params.get(keys.map);
  const stage = params.get(keys.stage);
  return {
    map: map !== null && offered.maps.includes(map) ? map : null,
    stage: stage !== null && offered.stages.includes(stage) ? stage : null,
  };
}

/** The query string for these filters, "" when all are defaults. */
export function purgeFiltersToSearch(filters: PurgeFilters): string {
  const params = new URLSearchParams();
  if (filters.map !== null) {
    params.set(keys.map, filters.map);
  }
  if (filters.stage !== null) {
    params.set(keys.stage, filters.stage);
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}
