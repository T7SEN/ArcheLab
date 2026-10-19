import {
  buildHref,
  type BuildKind,
} from "@/features/amorphous/amorphous-filters";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { slugOf } from "@/lib/slug";

/**
 * The Basic Materials index's items and filters (ADR 0045): pure functions over plain
 * data, so the client grid and the unit tests share them. The tier, what a material is
 * used for, the search and the open material live in the URL query; defaults stay out
 * of the URL.
 */

/** What a material is used for: a Descendant, weapon, Fellow or vehicle, or an Enhancement Material. */
export type UseKind = BuildKind | "enhancement";

/** One thing a material goes into, directly or through the part it makes. */
export interface MaterialUse {
  readonly kind: UseKind;
  readonly slug: string;
  readonly name: string;
}

/**
 * The kinds in the filter's order, with the filter's label, the words a sentence uses
 * for one and for several, and the index whose icon the filter shows.
 */
export const useKinds: readonly {
  readonly kind: UseKind;
  readonly label: string;
  readonly one: string;
  readonly many: string;
  readonly href: string;
}[] = [
  {
    kind: "descendant",
    label: "Descendants",
    one: "Descendant",
    many: "Descendants",
    href: "/descendants",
  },
  {
    kind: "weapon",
    label: "Weapons",
    one: "weapon",
    many: "weapons",
    href: "/weapons",
  },
  {
    kind: "enhancement",
    label: "Enhancement Materials",
    one: "Enhancement Material",
    many: "Enhancement Materials",
    href: "/enhancement-materials",
  },
  {
    kind: "fellow",
    label: "Fellows",
    one: "Fellow",
    many: "Fellows",
    href: "/fellows",
  },
  {
    kind: "vehicle",
    label: "Vehicles",
    one: "vehicle",
    many: "vehicles",
    href: "/vehicles",
  },
];

/** Where a use's page, or its details on its index, is. */
export function hrefOfUse(use: MaterialUse): string {
  return use.kind === "enhancement"
    ? `/enhancement-materials?material=${use.slug}`
    : buildHref({ kind: use.kind, slug: use.slug, name: use.name });
}

/**
 * How many things of each kind a material goes into, as a card says it: "16
 * Descendants · 15 weapons · 4 Enhancement Materials". Empty when it goes into none.
 */
export function usesSummary(uses: readonly MaterialUse[]): string {
  return useKinds
    .flatMap((entry) => {
      const count = uses.filter((use) => use.kind === entry.kind).length;
      if (count === 0) {
        return [];
      }
      return [`${String(count)} ${count === 1 ? entry.one : entry.many}`];
    })
    .join(" · ");
}

/** A card on the index. */
export interface BasicMaterial {
  readonly slug: string;
  readonly name: string;
  /** NEXON's tier id: `Tier3`. */
  readonly tier: string;
  /** The Library's description. */
  readonly description: string;
  readonly imageUrl: string;
  /** What it goes into, in `useKinds` order, then A–Z. */
  readonly uses: readonly MaterialUse[];
  /** Where it drops, as the game words it; empty when that isn't listed. */
  readonly sources: readonly string[];
  /** Its places that have a page, by name as in `sources` (ADR 0050). */
  readonly placeLinks?: Readonly<Record<string, string>>;
  /** The Miscellaneous item of the same name, by its address (ADR 0050). */
  readonly miscTwin?: string;
}

export interface BasicFilters {
  /** A tier's slug: `ultimate`. */
  readonly tier: string | null;
  /** What the shown materials go into. */
  readonly kind: UseKind | null;
  /** Words every shown material holds, ignoring case. */
  readonly query: string;
  /** The material whose details are open, by its slug. */
  readonly open: string | null;
}

export const defaultBasicFilters: BasicFilters = {
  tier: null,
  kind: null,
  query: "",
  open: null,
};

const keys = {
  tier: "tier",
  kind: "for",
  query: "q",
  open: "material",
} as const;

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseBasicFilters(
  search: string,
  offered: {
    readonly tiers: readonly string[];
    readonly materials: readonly string[];
  },
): BasicFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  const kind = useKinds.find((entry) => entry.kind === params.get(keys.kind));
  return {
    tier: pick(params.get(keys.tier), offered.tiers),
    kind: kind?.kind ?? null,
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.materials),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function basicFiltersToSearch(filters: BasicFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.tier, filters.tier],
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
 * The materials that pass every filter, in the index's order. A search word may match
 * the name, the description, what it goes into or where it drops, so "bunny" finds
 * every material Bunny is researched with, and "kingston" every one found there.
 */
export function filterBasic<T extends BasicMaterial>(
  items: readonly T[],
  filters: BasicFilters,
  tiers: readonly CosmeticTier[],
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  const tierSlug = (id: string) =>
    slugOf(tiers.find((tier) => tier.id === id)?.name ?? "");
  return items.filter((item) => {
    if (filters.tier !== null && tierSlug(item.tier) !== filters.tier) {
      return false;
    }
    if (
      filters.kind !== null &&
      !item.uses.some((use) => use.kind === filters.kind)
    ) {
      return false;
    }
    const text = fold(
      [
        item.name,
        item.description,
        ...item.uses.map((use) => use.name),
        ...item.sources,
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}
