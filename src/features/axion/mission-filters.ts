/**
 * The Axion Operational Areas page's data shapes and URL query (ADR 0052): pure, so the
 * page and the unit tests share them. The chosen day and mission live in the URL query;
 * defaults stay out of it. A mission's drops are shaped as the 400% Infiltration
 * Operations page's (ADR 0049), whose reward list the page shares.
 */

import type { Drop400 } from "@/features/infiltration-400/operation-filters";

/** One of the seven missions. */
export interface AxionMission {
  /** "first-crater"; unique. */
  readonly slug: string;
  /** As the game writes it: "First Crater". */
  readonly name: string;
  /** The Amorphous Material Pattern its completion gives, which no other gives. */
  readonly pattern: {
    readonly name: string;
    readonly imageUrl: string;
    readonly href: string | null;
  } | null;
  /** Its Transcendent weapon chance on completion, as Update 1.4.0 writes it. */
  readonly transcendent: {
    readonly chance: string;
    readonly min: number;
    readonly max: number;
  } | null;
  /** Materials first, then cores, each A to Z. */
  readonly drops: readonly Drop400[];
}

export interface AxionFilters {
  /** A day after today, by its local date ("2026-10-20"); null is today. */
  readonly day: string | null;
  /** The mission whose rewards are open, by its address; null is the first active. */
  readonly open: string | null;
}

export const defaultAxionFilters: AxionFilters = { day: null, open: null };

const keys = { day: "day", open: "mission" } as const;

/** How many days the schedule shows: today and the six after it. */
export const scheduleDays = 7;

/**
 * Filters from a URL query string. A day the schedule doesn't show is today; a mission
 * the page doesn't have is ignored.
 */
export function parseAxionFilters(
  search: string,
  offered: {
    /** The schedule's days after today, by local date. */
    readonly days: readonly string[];
    readonly missions: readonly string[];
  },
): AxionFilters {
  const params = new URLSearchParams(search);
  const day = params.get(keys.day);
  const open = params.get(keys.open);
  return {
    day: day !== null && offered.days.includes(day) ? day : null,
    open: open !== null && offered.missions.includes(open) ? open : null,
  };
}

/** The query string for these filters, "" when all are defaults. */
export function axionFiltersToSearch(filters: AxionFilters): string {
  const params = new URLSearchParams();
  if (filters.day !== null) {
    params.set(keys.day, filters.day);
  }
  if (filters.open !== null) {
    params.set(keys.open, filters.open);
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}

/** A local day of the schedule: its date key and when it starts and ends, in ms. */
export interface LocalDay {
  readonly key: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Today and the days after it, in the time zone the clock runs in: the browser's, for
 * visitors. A day is midnight to midnight, so one with a clock change is 23 or 25 hours.
 */
export function localDays(now: number, count: number): LocalDay[] {
  const today = new Date(now);
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index,
    );
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index + 1,
    );
    const pad = (value: number) => String(value).padStart(2, "0");
    return {
      key: `${String(start.getFullYear())}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      start: start.getTime(),
      end: end.getTime(),
    };
  });
}
