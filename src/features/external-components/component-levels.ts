/**
 * Each external component card's levels live in a static JSON file of their own, built
 * with the pages and loaded only when its details open (ADR 0027), as for modules and
 * reactors.
 */

/** A piece's base stat at one level. */
export interface ComponentLevel {
  readonly level: number;
  readonly value: number;
}

/** A card's data file: each piece's levels by NEXON id, lowest first. */
export interface ComponentLevelsFile {
  readonly levels: Readonly<Partial<Record<string, readonly ComponentLevel[]>>>;
}

/** Where a card's data file is served. */
export function componentDataUrl(slug: string): string {
  return `/external-components/data/${slug}`;
}

function isLevel(value: unknown): value is ComponentLevel {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const level = value as Record<string, unknown>;
  return typeof level.level === "number" && typeof level.value === "number";
}

/**
 * A data file as the browser received it, or null if it isn't one: an old file from a
 * cache, or an error page, never reaches the details.
 */
export function readComponentLevels(data: unknown): ComponentLevelsFile | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const levels = (data as Record<string, unknown>).levels;
  if (typeof levels !== "object" || levels === null) {
    return null;
  }
  const checked: Record<string, readonly ComponentLevel[]> = {};
  for (const [id, list] of Object.entries(levels)) {
    if (!Array.isArray(list) || !list.every(isLevel)) {
      return null;
    }
    checked[id] = list;
  }
  return { levels: checked };
}
