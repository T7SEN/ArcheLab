import "server-only";
import { z } from "zod";

/**
 * NEXON's keyless static metadata (docs/SPEC.md section 6, ADR 0018): one loader for
 * every set, so each tool brings only its own entry schema.
 */

/** The sets that answered keyless on 2026-10-15 (docs/SPEC.md section 6). */
export const metadataSets = [
  "descendant",
  "descendant-group",
  "weapon",
  "module",
  "reactor",
  "external-component",
  "reward",
  "stat",
  "void-battle",
  "title",
  "core-type",
  "arche-tuning-node",
  "amorphous-open-condition-description",
  "research",
  "fellow",
  // Answered keyless on 2026-10-16: material names, images and acquisition (ADR 0023).
  "consumable-material",
  // Answered keyless on 2026-10-16: weapon type names by id, which modules use (ADR 0025).
  "weapon-type",
  // Answered keyless on 2026-10-17: the three hover bikes, with art and stats (ADR 0037).
  "vehicle",
  // Answered keyless on 2026-10-17: 2,123 cosmetics, with art, tiers and who can use
  // them (ADR 0039).
  "customizing-item",
  // In NEXON's documented list, read on 2026-10-17: the 64 Mutant Cells with icons and
  // effects, and their sockets' names (ADR 0040).
  "node-item",
  "node-socket-type",
  // In NEXON's documented list, read on 2026-10-17: what each Amorphous Material
  // Pattern opens into, and the names of the places items drop (ADR 0041).
  "amorphous-reward",
  "acquisition-detail",
  // In NEXON's documented list, read on 2026-10-17: the core types each weapon's and
  // external component's core slots take (ADR 0042).
  "core-slot",
] as const;

export type MetadataSet = (typeof metadataSets)[number];

export const metadataBaseUrl = "https://open.api.nexon.com/static/tfd/meta/en/";

/**
 * Sets NEXON serves with no language, one level up (its documented list, read
 * 2026-10-17): `amorphous-reward.json` and `core-slot.json` answer 403 under `en/`.
 */
const languageFreeSets: readonly MetadataSet[] = [
  "amorphous-reward",
  "core-slot",
];

/** Where a set lives. */
export function metadataUrl(set: MetadataSet): string {
  return languageFreeSets.includes(set)
    ? `${metadataBaseUrl.replace(/en\/$/, "")}${set}.json`
    : `${metadataBaseUrl}${set}.json`;
}

/** Images are only ever loaded from NEXON's static image host. */
export const imageHost = "https://open.api.nexon.com/static/tfd/img/";

/** An image URL on NEXON's image host; anything else fails validation. */
export const nexonImageUrl = z.string().startsWith(imageHost);

const fetchTimeoutMs = 15_000;

/**
 * The entries of a set that pass `schema`. Each entry is checked on its own, so one
 * malformed entry never hides the others; data that is not a list has no entries.
 */
export function entriesFrom<T>(
  data: unknown,
  schema: z.ZodType<T>,
): { entries: T[]; dropped: number } {
  if (!Array.isArray(data)) {
    return { entries: [], dropped: 0 };
  }
  const entries: T[] = [];
  for (const entry of data) {
    const result = schema.safeParse(entry);
    if (result.success) {
      entries.push(result.data);
    }
  }
  return { entries, dropped: data.length - entries.length };
}

/** A failed fetch is tried once more after a pause, before the set is given up. */
const fetchAttempts = 2;
const retryDelayMs = 2_000;

/**
 * Fetches a set while a page is prerendered (ADR 0008). A failure is retried once, and
 * never breaks the build: it logs a warning and returns no entries, and the page leaves
 * that data out. Callers memoize the result per build worker, so a set given up stays
 * empty for every page that worker renders; the retry keeps one slow answer from
 * turning pages into 404s (2026-10-16).
 * The weekly scheduled deploy refetches, keeping the data far inside the 30-day limit
 * (Nexon API Terms §8.7).
 */
export async function fetchMetadataSet<T>(
  set: MetadataSet,
  schema: z.ZodType<T>,
): Promise<T[]> {
  let failure: unknown;
  for (let attempt = 1; attempt <= fetchAttempts; attempt += 1) {
    try {
      const response = await fetch(metadataUrl(set), {
        signal: AbortSignal.timeout(fetchTimeoutMs),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${String(response.status)}`);
      }
      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("the data is not a list");
      }
      const { entries, dropped } = entriesFrom(data, schema);
      if (dropped > 0) {
        console.warn(
          `NEXON ${set}.json: ${String(dropped)} entries failed validation and were left out.`,
        );
      }
      return entries;
    } catch (error) {
      failure = error;
      if (attempt < fetchAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  console.warn(
    `Could not load NEXON ${set}.json (${String(failure)}). Pages leave this data out.`,
  );
  return [];
}
