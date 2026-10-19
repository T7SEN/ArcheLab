/**
 * The 400% Infiltration Operations page's data shapes and URL query (ADR 0049): pure,
 * so the page and the unit tests share them. The chosen day and operation live in the
 * URL query; defaults stay out of it.
 */

import { dayKey, dayOfKey } from "./day-400";

/** What kind of drop a reward is, for the page's reward tabs. */
export type DropKind = "module" | "reactor" | "component" | "material" | "core";

/** An item that drops in an operation, with each way it comes, in the game's words. */
export interface Drop400 {
  readonly name: string;
  readonly imageUrl: string;
  readonly kind: DropKind;
  /** Its page on ArcheLab, or null. */
  readonly href: string | null;
  /** "complete", "Mission Monster"; none for equipment, whose lists don't say. */
  readonly ways: readonly string[];
  /** A word after its name: "all 4 pieces" for an external component set. */
  readonly detail?: string;
}

/** An operation that has a 400% difficulty. */
export interface Operation400 {
  /** "the-shelter"; unique. */
  readonly slug: string;
  /** As the game writes it: "The Shelter". */
  readonly name: string;
  readonly region: string;
  /** Its Transcendent weapon chance on completion at 400%, as Update 1.4.0 writes it. */
  readonly transcendent: {
    readonly chance: string;
    readonly min: number;
    readonly max: number;
  } | null;
  /** Whether the daily cycle names it. */
  readonly inCycle: boolean;
  /** Materials first, then cores, each A to Z. */
  readonly drops: readonly Drop400[];
}

export interface Operation400Filters {
  /** A day after today; null is today. */
  readonly day: number | null;
  /** The operation whose rewards are open, by its address; null is the day's first. */
  readonly open: string | null;
}

export const defaultOperation400Filters: Operation400Filters = {
  day: null,
  open: null,
};

const keys = { day: "day", open: "operation" } as const;

/** How far ahead the page goes: seven weeks, within one whole cycle. */
export const weeksAhead = 7;
export const daysAhead = weeksAhead * 7;

/**
 * Filters from a URL query string. A day that has passed, or one past the weeks ahead,
 * shows today; an operation the page doesn't have is ignored.
 */
export function parseOperation400Filters(
  search: string,
  offered: {
    readonly today: number | null;
    readonly operations: readonly string[];
  },
): Operation400Filters {
  const params = new URLSearchParams(search);
  const day = dayOfKey(params.get(keys.day) ?? "");
  const open = params.get(keys.open);
  return {
    day:
      day !== null &&
      offered.today !== null &&
      day > offered.today &&
      day < offered.today + daysAhead
        ? day
        : null,
    open: open !== null && offered.operations.includes(open) ? open : null,
  };
}

/** The query string for these filters, "" when all are defaults. */
export function operation400FiltersToSearch(
  filters: Operation400Filters,
): string {
  const params = new URLSearchParams();
  if (filters.day !== null) {
    params.set(keys.day, dayKey(filters.day));
  }
  if (filters.open !== null) {
    params.set(keys.open, filters.open);
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}

/** A reward as the page lists it: a drop, or every grade of one kind of core. */
export interface RewardEntry {
  /** The core's name without its grade, or the drop's name. */
  readonly name: string;
  /** "VII–X", "V", "V, VII": the grades of a core; null for any other drop. */
  readonly grades: string | null;
  readonly imageUrl: string;
  readonly kind: DropKind;
  readonly href: string | null;
  readonly ways: readonly string[];
  readonly detail?: string;
}

const romanValues: Readonly<Record<string, number>> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
};

/** Grades as the cores page writes a span: consecutive ones as "VII–X". */
function gradeText(grades: readonly string[]): string {
  const sorted = [...grades].sort(
    (a, b) => (romanValues[a] ?? 0) - (romanValues[b] ?? 0),
  );
  const values = sorted.map((grade) => romanValues[grade] ?? 0);
  const consecutive = values.every(
    (value, index) => index === 0 || value === (values[index - 1] ?? 0) + 1,
  );
  const first = sorted.at(0) ?? "";
  const last = sorted.at(-1) ?? "";
  if (sorted.length === 1) {
    return first;
  }
  return consecutive ? `${first}–${last}` : sorted.join(", ");
}

/** The ways a drop comes, in the order the drop lists give them, then any other A–Z. */
const wayOrder = ["complete", "Mission Monster"];

const wayRank = (way: string) => {
  const at = wayOrder.indexOf(way);
  return at === -1 ? wayOrder.length : at;
};

/**
 * The rewards to list: every grade of a kind of core in one entry ("Defense
 * Augmentation Core", "VII–X"), with the highest grade's art and every way any grade
 * comes, "complete" first (T7SEN, 2026-10-19); the rest as they are. Order is kept,
 * each core at its first grade's place.
 */
export function rewardEntries(drops: readonly Drop400[]): RewardEntry[] {
  const entries: RewardEntry[] = [];
  const cores = new Map<string, { drops: Drop400[]; at: number }>();
  for (const drop of drops) {
    const match =
      drop.kind === "core" ? /^(.*) ([IVX]+)$/.exec(drop.name) : null;
    const base = match?.[1];
    const grade = match?.[2];
    if (base === undefined || grade === undefined || !(grade in romanValues)) {
      entries.push({ ...drop, grades: null });
      continue;
    }
    const known = cores.get(base);
    if (known === undefined) {
      cores.set(base, { drops: [drop], at: entries.length });
      entries.push({ ...drop, name: base, grades: grade });
    } else {
      known.drops.push(drop);
    }
  }
  for (const [base, { drops: grades, at }] of cores) {
    const names = grades.map((drop) => drop.name.slice(base.length + 1));
    const top = [...grades]
      .sort(
        (a, b) =>
          (romanValues[b.name.slice(base.length + 1)] ?? 0) -
          (romanValues[a.name.slice(base.length + 1)] ?? 0),
      )
      .at(0);
    entries[at] = {
      name: base,
      grades: gradeText(names),
      imageUrl: top?.imageUrl ?? "",
      kind: "core",
      href: top?.href ?? null,
      ways: [...new Set(grades.flatMap((drop) => drop.ways))].sort(
        (a, b) => wayRank(a) - wayRank(b) || a.localeCompare(b),
      ),
    };
  }
  return entries;
}
