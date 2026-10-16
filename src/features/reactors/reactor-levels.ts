/**
 * Each reactor's levels live in a static JSON file of their own, built with the pages
 * and loaded only when its details open (ADR 0026): 100 levels at three tiers are about
 * 30 KB a reactor, too much for the index page.
 */

/** One enchant level's bonus at a reactor level. */
export interface ReactorEnchant {
  /** The enchant level, from 1. */
  readonly level: number;
  /** The stat's name, such as "Skill Power", or null when `stat.json` has none. */
  readonly stat: string | null;
  readonly value: number;
}

/** A reactor's numbers at one level. */
export interface ReactorLevel {
  readonly level: number;
  readonly skillPower: number;
  readonly subAttackPower: number;
  /** Lowest enchant level first. */
  readonly enchants: readonly ReactorEnchant[];
}

/** A reactor's data file: each tier's levels by NEXON id, lowest first. */
export interface ReactorLevelsFile {
  readonly levels: Readonly<Record<string, readonly ReactorLevel[]>>;
}

/** Where a reactor's data file is served. */
export function reactorDataUrl(slug: string): string {
  return `/reactors/data/${slug}`;
}

function isEnchant(value: unknown): value is ReactorEnchant {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const enchant = value as Record<string, unknown>;
  return (
    typeof enchant.level === "number" &&
    (typeof enchant.stat === "string" || enchant.stat === null) &&
    typeof enchant.value === "number"
  );
}

function isLevel(value: unknown): value is ReactorLevel {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const level = value as Record<string, unknown>;
  return (
    typeof level.level === "number" &&
    typeof level.skillPower === "number" &&
    typeof level.subAttackPower === "number" &&
    Array.isArray(level.enchants) &&
    level.enchants.every(isEnchant)
  );
}

/**
 * A data file as the browser received it, or null if it isn't one: an old file from a
 * cache, or an error page, never reaches the details.
 */
export function readReactorLevels(data: unknown): ReactorLevelsFile | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const levels = (data as Record<string, unknown>).levels;
  if (typeof levels !== "object" || levels === null) {
    return null;
  }
  const checked: Record<string, readonly ReactorLevel[]> = {};
  for (const [id, list] of Object.entries(levels)) {
    if (!Array.isArray(list) || !list.every(isLevel)) {
      return null;
    }
    checked[id] = list;
  }
  return { levels: checked };
}
