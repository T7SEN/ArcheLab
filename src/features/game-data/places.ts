/**
 * Where an item drops, grouped for reading (T7SEN, 2026-10-18; ADR 0045): pure, for the
 * boxes of `place-groups.tsx` and the tests. Used by the Basic Materials, Amorphous
 * Materials, Enhancement Materials and Cores pages.
 */

/** The fewest lines a box needs before it may span the row (`isWideBox`). */
const wideBoxLines = 8;

/**
 * Whether a box spans its row: a long one holding most of the lines, which would
 * otherwise stand as one tall column beside short ones, like the 28 component sets
 * beside 3 cards without a set (T7SEN, 2026-10-18).
 */
export function isWideBox(lines: number, totalLines: number): boolean {
  return lines >= wideBoxLines && lines * 2 > totalLines;
}

/** One place in a group, with each way it gives the item there. */
export interface Place {
  /** "[First Crater]", "[Reina]". */
  readonly name: string;
  /** What follows the name, as the game words it: "complete", "Mission Monster"; may be empty. */
  readonly ways: readonly string[];
}

/** Places an item drops, under the part of their names they share. */
export interface PlaceGroup {
  /** "[Axion Plains] [Hard]", "Dismantle [Reactor]"; null for places with nothing shared. */
  readonly title: string | null;
  readonly places: readonly Place[];
}

/**
 * Where `mark` first comes outside brackets, or -1: the " - " of "[Trials - Protocol
 * 001]" and the ": " of "[Amorphous Material Pattern: Bunny]" are part of one name.
 */
function indexOutsideBrackets(text: string, mark: string): number {
  let depth = 0;
  for (let at = 0; at < text.length; at += 1) {
    const char = text[at];
    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && text.startsWith(mark, at)) {
      return at;
    }
  }
  return -1;
}

/**
 * A place name as the game words it, in its parts: what comes before " - " (or ": ")
 * outside brackets, the place up to its last "]", and the way after it.
 * "[Vespers] [Hard] - [Sepulcher] complete" is "[Vespers] [Hard]", "[Sepulcher]" and
 * "complete".
 */
export function splitPlace(name: string): {
  readonly title: string | null;
  readonly place: string;
  readonly way: string;
} {
  const cut = [" - ", ": "]
    .map((mark) => ({ mark, at: indexOutsideBrackets(name, mark) }))
    .find((entry) => entry.at > 0);
  const title = cut === undefined ? null : name.slice(0, cut.at);
  const rest = cut === undefined ? name : name.slice(cut.at + cut.mark.length);
  // The name runs to the last "]"; what follows is the way.
  const close = rest.lastIndexOf("]");
  return {
    title,
    place: close === -1 ? rest : rest.slice(0, close + 1),
    way: close === -1 ? "" : rest.slice(close + 1).trim(),
  };
}

/**
 * Places as the game words them, grouped by what comes before " - " (or before ": ",
 * as in "Intercept Battle: [Extreme] [Gluttony]"), outside brackets, in the order they
 * first come; names with neither go last, in one untitled group. Within a group, one
 * place's ways share a line: "[Sepulcher] complete" and "[Sepulcher] Mission Monster"
 * are "[Sepulcher]" with two ways.
 */
export function groupPlaces(names: readonly string[]): PlaceGroup[] {
  const groups = new Map<string | null, Map<string, string[]>>();
  for (const name of names) {
    const { title, place, way } = splitPlace(name);
    const places = groups.get(title) ?? new Map<string, string[]>();
    const ways = places.get(place) ?? [];
    if (way !== "" && !ways.includes(way)) {
      ways.push(way);
    }
    places.set(place, ways);
    groups.set(title, places);
  }
  return [...groups]
    .map(([title, places]) => ({
      title,
      places: [...places].map(([name, ways]) => ({ name, ways })),
    }))
    .sort((a, b) => Number(a.title === null) - Number(b.title === null));
}

/**
 * An item's drop places that have a page, by name as its place list words them (ADR
 * 0050): each id it lists, named by `names` and linked by `hrefs`. A name two ids share
 * (a 400% place and its Hard one) links when either has a page. As an object to spread
 * into the item: empty when none links, so an item without one keeps its shape.
 */
export function withPlaceLinks(
  ids: readonly string[],
  names: ReadonlyMap<string, string>,
  hrefs: ReadonlyMap<string, string> = new Map(),
): { readonly placeLinks?: Readonly<Record<string, string>> } {
  const placeLinks: Record<string, string> = {};
  for (const id of ids) {
    const name = names.get(id);
    const href = hrefs.get(id);
    if (name !== undefined && href !== undefined) {
      placeLinks[name] ??= href;
    }
  }
  return Object.keys(placeLinks).length === 0 ? {} : { placeLinks };
}
