/**
 * The Amorphous Materials index's patterns and filters (ADR 0041): pure functions over
 * plain data, so the client grid and the unit tests share them. What a pattern is for,
 * the search and the open pattern live in the URL query, so a filtered view or a pattern
 * can be shared; defaults stay out of the URL.
 */

/** The game's prefix on every pattern's name. */
export const patternPrefix = "Amorphous Material Pattern: ";

/** What a pattern, or a reward, is for. */
export type BuildKind = "descendant" | "weapon" | "fellow" | "vehicle";

export interface AmorphousBuild {
  readonly kind: BuildKind;
  readonly slug: string;
  readonly name: string;
}

/**
 * The kinds in the filter's order, with its labels and the index each has, whose icon
 * the filter shows (T7SEN, 2026-10-17: like the weapons' Rounds filter).
 */
export const buildKinds: readonly {
  readonly kind: BuildKind;
  readonly label: string;
  readonly href: string;
}[] = [
  { kind: "descendant", label: "Descendants", href: "/descendants" },
  { kind: "weapon", label: "Weapons", href: "/weapons" },
  { kind: "fellow", label: "Fellows", href: "/fellows" },
  { kind: "vehicle", label: "Vehicles", href: "/vehicles" },
];

/** Where a build's page, or its details on its index, is. */
export function buildHref(build: AmorphousBuild): string {
  switch (build.kind) {
    case "descendant":
      return `/descendants/${build.slug}`;
    case "weapon":
      return `/weapons/${build.slug}`;
    case "fellow":
      return `/fellows?fellow=${build.slug}`;
    case "vehicle":
      return `/vehicles?vehicle=${build.slug}`;
  }
}

/** One thing a pattern opens into. */
export interface AmorphousReward {
  /** NEXON's material id. */
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  /** The chance, in percent: 38 for 38%. */
  readonly rate: number;
  /** What it is a part of, when that is known. */
  readonly build: AmorphousBuild | null;
}

/** A card on the index. */
export interface AmorphousPattern {
  readonly slug: string;
  /** The name after the prefix: "Bunny", "E-Buster". */
  readonly name: string;
  /** Its tier as NEXON writes tiers (`src/data/amorphous-materials.ts`): `Tier3`. */
  readonly tier: string;
  /** What it is for: a Descendant, a weapon, a Fellow or a vehicle; null if unknown. */
  readonly kind: BuildKind | null;
  readonly imageUrl: string;
  /** In NEXON's order, highest chance first. */
  readonly rewards: readonly AmorphousReward[];
  /** Where it drops, as the game words it; empty when that isn't listed. */
  readonly sources: readonly string[];
}

/** A chance as the game shows it: "38%", "2.5%". */
export function rateText(rate: number): string {
  return `${String(Math.round(rate * 10) / 10)}%`;
}

export interface AmorphousFilters {
  /** What the shown patterns are for. */
  readonly kind: BuildKind | null;
  /** Words every shown pattern holds, ignoring case. */
  readonly query: string;
  /** The pattern whose details are open, by its slug. */
  readonly open: string | null;
}

export const defaultAmorphousFilters: AmorphousFilters = {
  kind: null,
  query: "",
  open: null,
};

const keys = {
  kind: "for",
  query: "q",
  open: "pattern",
} as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseAmorphousFilters(
  search: string,
  offered: { readonly patterns: readonly string[] },
): AmorphousFilters {
  const params = new URLSearchParams(search);
  const kind = buildKinds.find((entry) => entry.kind === params.get(keys.kind));
  const open = params.get(keys.open);
  return {
    kind: kind?.kind ?? null,
    query: params.get(keys.query) ?? "",
    open: open !== null && offered.patterns.includes(open) ? open : null,
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function amorphousFiltersToSearch(filters: AmorphousFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.kind, filters.kind],
    [keys.query, filters.query === "" ? null : filters.query],
    [keys.open, filters.open],
  ];
  for (const [key, value] of values) {
    if (value !== null) {
      params.set(key, value);
    }
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}

/** Text as the search compares it: lowercase, with curly apostrophes as straight ones. */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/**
 * The patterns that pass every filter, in the index's order. A search word may match
 * the name, a reward, what a reward builds or where the pattern drops, so "ultimate
 * valby" finds every pattern with a part for Ultimate Valby.
 */
export function filterAmorphous<T extends AmorphousPattern>(
  patterns: readonly T[],
  filters: AmorphousFilters,
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  return patterns.filter((pattern) => {
    if (filters.kind !== null && pattern.kind !== filters.kind) {
      return false;
    }
    const text = fold(
      [
        pattern.name,
        ...pattern.rewards.flatMap((reward) => [
          reward.name,
          reward.build?.name ?? "",
        ]),
        ...pattern.sources,
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}
