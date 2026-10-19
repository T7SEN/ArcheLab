import type { CoreGrade } from "@/features/game-data/core-types";
import { coreOptionLabel } from "@/features/game-data/core-types";
import { slugOf } from "@/lib/slug";

/**
 * The kinds whose plain cores ("Defense Augmentation Core VII") count as theirs, beside
 * the Variant AB ones: no core type in NEXON's data takes the plain ones, but they drop
 * in the same places. Drop lists open their card (T7SEN, 2026-10-18; ADR 0049), and
 * their card lists where they drop (ADR 0050).
 */
export const plainCoreKinds: ReadonlySet<string> = new Set([
  "defense",
  "recovery",
]);

/**
 * The Cores index's cards and filters (T7SEN, 2026-10-18; ADR 0044): pure functions over
 * plain data, so the client grid and the unit tests share them. What a card is for, the
 * weapon type, the search and the open card live in the URL query; defaults stay out of
 * the URL.
 */

/** What a core goes in: Ultimate weapons' slots or Ultimate external components'. */
export type CoreEquipment = "weapons" | "components";

/**
 * One version of a core kind: what it rolls on the weapons whose slots take it. A
 * Firepower core rolls Firearm ATK on most firearms, Explosive ATK on Launchers and
 * Melee Weapon ATK on melee weapons, each a core type of its own in NEXON's data.
 */
export interface CoreVersion {
  /** Its `core-type.json` id. */
  readonly id: string;
  /** The weapon types whose slots take it, A–Z; empty for external components. */
  readonly weaponTypes: readonly string[];
  /** Each grade, lowest first: the core items it takes and what they can roll. */
  readonly grades: readonly CoreGrade[];
}

/** A weapon whose slots take a core kind, and which of its slots do. */
export interface CoreWeapon {
  readonly slug: string;
  readonly name: string;
  /** "Assault Rifle", "Launcher" and so on. */
  readonly type: string;
  /** Its slots that take the kind, in the game's order: "Free", "Firepower". */
  readonly slots: readonly string[];
}

/** An external component card whose pieces' slots take a core kind. */
export interface CoreComponent {
  /** Its card on the external components index. */
  readonly slug: string;
  readonly name: string;
  /** A set with set effects, or a component with none (HP Support). */
  readonly set: boolean;
  /** The pieces' rarity name ("Ultimate"), the index's tier filter; null if unknown. */
  readonly tier: string | null;
}

/** A core item at one grade, and where it drops. */
export interface CoreDrop {
  /** As the game names it: "Firepower Augmentation Core X". */
  readonly name: string;
  readonly imageUrl: string;
  /** Where it drops, as the game words it; empty when none is listed. */
  readonly sources: readonly string[];
  /** Its places that have a page, by name as in `sources` (ADR 0050). */
  readonly placeLinks?: Readonly<Record<string, string>>;
}

/** A card on the index: a kind of core, by the slot it goes in. */
export interface CoreKind {
  /** The slot's name as an address: `firepower`. */
  readonly slug: string;
  /** As the game names the core type: "Firepower Augmentation". */
  readonly name: string;
  /** The slot it goes in: "Firepower". */
  readonly slot: string;
  readonly equipment: CoreEquipment;
  /** Its highest grade's art. */
  readonly imageUrl: string;
  /** Its versions, in NEXON's id order; never empty. */
  readonly versions: readonly CoreVersion[];
  /** Each grade's core items with where they drop, lowest grade first. */
  readonly drops: readonly {
    readonly grade: number;
    readonly items: readonly CoreDrop[];
  }[];
  /** The Ultimate weapons whose slots take it, by type, then A–Z. */
  readonly weapons: readonly CoreWeapon[];
  /**
   * The external component cards with Ultimate pieces whose slots take it, A–Z: the
   * page counts these, as the external components index counts cards, not pieces.
   */
  readonly componentCards: readonly CoreComponent[];
}

export interface CoreFilters {
  /** What it goes in. */
  readonly equipment: CoreEquipment | null;
  /** A weapon type's slug: `launcher`. */
  readonly weaponType: string | null;
  /** Words every shown card holds, ignoring case. */
  readonly query: string;
  /** The card whose details are open, by its slug. */
  readonly open: string | null;
}

export const defaultCoreFilters: CoreFilters = {
  equipment: null,
  weaponType: null,
  query: "",
  open: null,
};

const keys = {
  equipment: "for",
  weaponType: "type",
  query: "q",
  open: "core",
} as const;

/** The For filter's choices, in order, with the index each one's icon comes from. */
export const coreEquipment: readonly {
  readonly equipment: CoreEquipment;
  readonly label: string;
  readonly href: string;
}[] = [
  { equipment: "weapons", label: "Weapons", href: "/weapons" },
  {
    equipment: "components",
    label: "External Components",
    href: "/external-components",
  },
];

/** Every weapon type a card's versions name, A–Z. */
export function coreWeaponTypes(kinds: readonly CoreKind[]): string[] {
  return [
    ...new Set(
      kinds.flatMap((kind) =>
        kind.versions.flatMap((version) => version.weaponTypes),
      ),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/**
 * Filters from a URL query string. Values the index doesn't offer are ignored, so an
 * old or edited link still opens a working page.
 */
export function parseCoreFilters(
  search: string,
  offered: {
    readonly weaponTypes: readonly string[];
    readonly kinds: readonly string[];
  },
): CoreFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  const equipment = params.get(keys.equipment);
  return {
    equipment:
      coreEquipment.find((entry) => entry.equipment === equipment)?.equipment ??
      null,
    weaponType: pick(params.get(keys.weaponType), offered.weaponTypes),
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.kinds),
  };
}

/**
 * The query for filters, with "?" when there is anything to say. A blank search is
 * kept, so the box keeps a space typed first; the URL leaves it out (`urlSearchOf`).
 */
export function coreFiltersToSearch(filters: CoreFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.equipment, filters.equipment],
    [keys.weaponType, filters.weaponType],
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
 * The versions to show with a weapon type chosen: the one its slots take. Every version
 * without one.
 */
export function shownVersions(
  kind: CoreKind,
  weaponType: string | null,
): readonly CoreVersion[] {
  return weaponType === null
    ? kind.versions
    : kind.versions.filter((version) =>
        version.weaponTypes.some((type) => slugOf(type) === weaponType),
      );
}

/** The weapons to show with a weapon type chosen: that type's. Every one without one. */
export function shownWeapons(
  kind: CoreKind,
  weaponType: string | null,
): readonly CoreWeapon[] {
  return weaponType === null
    ? kind.weapons
    : kind.weapons.filter((weapon) => slugOf(weapon.type) === weaponType);
}

/** What a kind's versions can roll, each name once, as the game writes them. */
export function rollNames(versions: readonly CoreVersion[]): string[] {
  return [
    ...new Set(
      versions.flatMap((version) =>
        (version.grades.at(-1)?.options ?? []).map(coreOptionLabel),
      ),
    ),
  ];
}

/**
 * The cards that pass every filter, in the index's order. A search word may match the
 * name, a core item, a roll, a weapon or its type, an external component card or a place
 * it drops, so "explosive" finds Firepower and "thunder cage" every core Thunder Cage
 * takes.
 */
export function filterCores<T extends CoreKind>(
  kinds: readonly T[],
  filters: CoreFilters,
): T[] {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  return kinds.filter((kind) => {
    if (filters.equipment !== null && kind.equipment !== filters.equipment) {
      return false;
    }
    const versions = shownVersions(kind, filters.weaponType);
    if (versions.length === 0) {
      return false;
    }
    const weapons = shownWeapons(kind, filters.weaponType);
    const text = fold(
      [
        kind.name,
        kind.slot,
        ...rollNames(versions),
        ...versions.flatMap((version) => version.weaponTypes),
        ...weapons.map((weapon) => weapon.name),
        ...kind.componentCards.map((card) => card.name),
        ...kind.drops.flatMap((grade) =>
          grade.items.flatMap((item) => [item.name, ...item.sources]),
        ),
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}

/**
 * A weapon's slots that take a kind, in a few words: "Free, Firepower ×2" for Free,
 * Firepower, Firepower.
 */
export function slotSummary(slots: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const slot of slots) {
    counts.set(slot, (counts.get(slot) ?? 0) + 1);
  }
  return [...counts]
    .map(([slot, count]) => (count === 1 ? slot : `${slot} ×${String(count)}`))
    .join(", ");
}

/**
 * External component cards in two groups, named as the external components index names
 * them: sets, then components with no set (HP Support), each in the order they come. A group with no card is left out.
 */
export function componentGroups(
  cards: readonly CoreComponent[],
): { readonly title: string; readonly cards: readonly CoreComponent[] }[] {
  return [
    { title: "Sets", cards: cards.filter((card) => card.set) },
    {
      title: "Components with no set",
      cards: cards.filter((card) => !card.set),
    },
  ].filter((group) => group.cards.length > 0);
}

/** Weapons grouped by type, in the order they come: types A–Z, then names A–Z. */
export function weaponsByType(
  weapons: readonly CoreWeapon[],
): { readonly type: string; readonly weapons: readonly CoreWeapon[] }[] {
  const groups = new Map<string, CoreWeapon[]>();
  for (const weapon of weapons) {
    groups.set(weapon.type, [...(groups.get(weapon.type) ?? []), weapon]);
  }
  return [...groups].map(([type, list]) => ({ type, weapons: list }));
}
