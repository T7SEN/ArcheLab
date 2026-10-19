/**
 * What drops in a battlefield lives in a static JSON file of its own, built with the
 * pages and loaded only when its details open (ADR 0048), as reactors' levels do.
 */

/** An item that drops at a place, with each way it comes, in the game's words. */
export interface DropItem {
  readonly name: string;
  /** Its page on ArcheLab, or null. */
  readonly href: string | null;
  /** "complete", "Mission Monster", "Support Complete". */
  readonly ways: readonly string[];
}

/** A place in a battlefield and what drops there. */
export interface PlaceDrops {
  /** As the game names it, without the region and difficulty: "[Lakeside]". */
  readonly place: string;
  readonly kind: "mission" | "outpost" | "fusion-reactor";
  /** A to Z. */
  readonly items: readonly DropItem[];
}

/** A battlefield's data file: its places on each difficulty. */
export interface BattlefieldDropsFile {
  readonly Normal: readonly PlaceDrops[];
  readonly Hard: readonly PlaceDrops[];
}

export const difficulties = ["Normal", "Hard"] as const;
export type Difficulty = (typeof difficulties)[number];

/** Where a battlefield's data file is served. */
export function battlefieldDataUrl(slug: string): string {
  return `/difficulty-level-rewards/data/${slug}`;
}

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

function isItem(value: unknown): value is DropItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.name === "string" &&
    (item.href === null || typeof item.href === "string") &&
    isStrings(item.ways)
  );
}

function isPlace(value: unknown): value is PlaceDrops {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const place = value as Record<string, unknown>;
  return (
    typeof place.place === "string" &&
    (place.kind === "mission" ||
      place.kind === "outpost" ||
      place.kind === "fusion-reactor") &&
    Array.isArray(place.items) &&
    place.items.every(isItem)
  );
}

/** A data file as fetched, or null when it isn't one. */
export function readBattlefieldDrops(
  data: unknown,
): BattlefieldDropsFile | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const file = data as Record<string, unknown>;
  return difficulties.every(
    (difficulty) =>
      Array.isArray(file[difficulty]) &&
      (file[difficulty] as unknown[]).every(isPlace),
  )
    ? (file as unknown as BattlefieldDropsFile)
    : null;
}
