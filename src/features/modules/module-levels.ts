/**
 * Each module's levels live in a static JSON file of their own, built with the pages and
 * loaded only when its details open (ADR 0025), so the index carries 573 cards and not
 * 1,001 modules' worth of effect text.
 */

/** A module's capacity and effect at one level. */
export interface ModuleLevel {
  readonly level: number;
  /** Null for Trigger modules, which take no capacity. */
  readonly capacity: number | null;
  /** The effect as NEXON words it, or null when it lists none (Ancestor modules). */
  readonly effect: string | null;
}

/** A module group's data file: each version's levels by NEXON id, lowest first. */
export interface ModuleLevelsFile {
  readonly levels: Readonly<Record<string, readonly ModuleLevel[]>>;
}

/** Where a module group's data file is served. */
export function moduleDataUrl(slug: string): string {
  return `/modules/data/${slug}`;
}

function isLevel(value: unknown): value is ModuleLevel {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const level = value as Record<string, unknown>;
  return (
    typeof level.level === "number" &&
    (typeof level.capacity === "number" || level.capacity === null) &&
    (typeof level.effect === "string" || level.effect === null)
  );
}

/**
 * A data file as the browser received it, or null if it isn't one: an old file from a
 * cache, or an error page, never reaches the panel.
 */
export function readLevelsFile(data: unknown): ModuleLevelsFile | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const levels = (data as Record<string, unknown>).levels;
  if (typeof levels !== "object" || levels === null) {
    return null;
  }
  const checked: Record<string, readonly ModuleLevel[]> = {};
  for (const [id, list] of Object.entries(levels)) {
    if (!Array.isArray(list) || !list.every(isLevel)) {
      return null;
    }
    checked[id] = list;
  }
  return { levels: checked };
}
