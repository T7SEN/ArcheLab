/**
 * The database page's search (T7SEN, 2026-10-17; ADR 0034): every Descendant, weapon,
 * module, reactor, external component, Fellow, vehicle and Mutant Cell in one list, from a static file,
 * `/database/items`, loaded once someone searches. Pure, for the browser and the tests.
 */

/** The database's categories, in the order the page and the results list them. */
export const databaseCategories = [
  {
    name: "Descendants",
    href: "/descendants",
    description:
      "Stats at every level, skills, exclusive modules and reactors.",
  },
  {
    name: "Weapons",
    href: "/weapons",
    description:
      "ATK by level, base stats, unique abilities, core slots and where to get them.",
  },
  {
    name: "Modules",
    href: "/modules",
    description:
      "Effects at every level, tiers, sockets and who can equip them.",
  },
  {
    name: "Reactors",
    href: "/reactors",
    description:
      "Skill Power by level, enchant bonuses and the Descendants they suit.",
  },
  {
    name: "External Components",
    href: "/external-components",
    description: "Base stats by level, set effects, sub-stats and core slots.",
  },
  {
    name: "Fellows",
    href: "/fellows",
    description:
      "Passives and stats at every level, Inversion Reinforcement effects and research.",
  },
  {
    name: "Vehicles",
    href: "/vehicles",
    description: "Speed, turning and boost at every level, and research.",
  },
  {
    name: "Mutant Cells",
    href: "/mutant-cells",
    description:
      "Every Mutant Cell by socket, what sets it off and its effects.",
  },
] as const;

export type DatabaseCategory = (typeof databaseCategories)[number]["name"];

/** One item as the search lists it. */
export interface DatabaseItem {
  readonly name: string;
  readonly category: DatabaseCategory;
  /** Its page, or its details on its index. */
  readonly href: string;
  /** A short note beside it: "Ultimate", "Transcendent · Assault Rifle". */
  readonly hint: string;
  /** More words that find it: types, tiers, pieces. */
  readonly keywords: readonly string[];
  /** Empty for an item with no art, such as a Fellow without its file (ADR 0035). */
  readonly imageUrl: string;
  /** Its tier's color, for its tile. */
  readonly hex: string;
}

/**
 * How an item's art fills its square tile: module and Mutant Cell icons whole, the rest
 * filling it, since weapon art is wide and shrank to a sliver.
 */
export const artFit = (item: DatabaseItem): string =>
  item.category === "Modules" || item.category === "Mutant Cells"
    ? "object-contain p-0.5"
    : "object-cover";

/** The file's shape. */
export interface DatabaseItemList {
  readonly items: readonly DatabaseItem[];
}

export const databaseItemsUrl = "/database/items";

/** A search needs this many characters, so one letter doesn't list hundreds. */
export const minimumQuery = 2;

const categoryNames: readonly string[] = databaseCategories.map(
  (category) => category.name,
);

function isItem(value: unknown): value is DatabaseItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.name === "string" &&
    typeof entry.category === "string" &&
    categoryNames.includes(entry.category) &&
    typeof entry.href === "string" &&
    typeof entry.hint === "string" &&
    typeof entry.imageUrl === "string" &&
    typeof entry.hex === "string" &&
    Array.isArray(entry.keywords) &&
    entry.keywords.every((keyword) => typeof keyword === "string")
  );
}

/** The list as the browser received it, or null if it isn't one. */
export function readDatabaseItems(
  data: unknown,
): readonly DatabaseItem[] | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const items = (data as Record<string, unknown>).items;
  return Array.isArray(items) && items.every(isItem) ? items : null;
}

/**
 * How well an item matches, lower first: its name is the search, starts with it, has a
 * word starting with it, holds it, or only its category, note or keywords do. Null
 * when a word of the search appears nowhere.
 */
function rank(item: DatabaseItem, query: string, words: readonly string[]) {
  const haystack = [item.name, item.category, item.hint, ...item.keywords]
    .join(" ")
    .toLowerCase();
  if (!words.every((word) => haystack.includes(word))) {
    return null;
  }
  const name = item.name.toLowerCase();
  if (name === query) {
    return 0;
  }
  if (name.startsWith(query)) {
    return 1;
  }
  if (name.split(/[\s'-]+/).some((part) => part.startsWith(query))) {
    return 2;
  }
  return words.every((word) => name.includes(word)) ? 3 : 4;
}

/**
 * The items a search finds, best first: by how well the name matches, then category
 * order, then A–Z. Empty under `minimumQuery` characters.
 */
export function searchDatabase(
  items: readonly DatabaseItem[],
  search: string,
): DatabaseItem[] {
  const query = search.trim().toLowerCase().replace(/\s+/g, " ");
  if (query.length < minimumQuery) {
    return [];
  }
  const words = query.split(" ");
  return items
    .flatMap((item) => {
      const score = rank(item, query, words);
      return score === null ? [] : [{ item, score }];
    })
    .sort(
      (a, b) =>
        a.score - b.score ||
        categoryNames.indexOf(a.item.category) -
          categoryNames.indexOf(b.item.category) ||
        a.item.name.localeCompare(b.item.name),
    )
    .map((entry) => entry.item);
}

let loading: Promise<readonly DatabaseItem[] | null> | null = null;

/** The list, fetched once per visit; a failure is asked for again next time. */
export function loadDatabaseItems(): Promise<readonly DatabaseItem[] | null> {
  loading ??= fetch(databaseItemsUrl)
    .then((response) => (response.ok ? response.json() : null))
    .then(readDatabaseItems)
    .catch(() => null)
    .then((items) => {
      if (items === null) {
        loading = null;
      }
      return items;
    });
  return loading;
}
