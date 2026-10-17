import "server-only";
import { z } from "zod";
import { cosmeticTypeName, everyDescendantTypes } from "@/data/cosmetics";
import type {
  CosmeticCard,
  CosmeticDescendant,
  CosmeticVersion,
} from "@/features/cosmetics/cosmetic-filters";
import { slugOf } from "@/lib/slug";
import {
  fetchDescendantLinks,
  fetchDescendantSummaries,
  type DescendantLink,
} from "./descendant-page";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";
import { numericId } from "./shared-sets";

/**
 * The Cosmetics index (ADR 0039): every entry in `customizing-item.json`, one card per
 * cosmetic. NEXON listed 2,123 entries on 2026-10-17 under 1,091 names: many cosmetics
 * come once per Descendant (Dinosaur Pajamas has a Body Skin for each), so entries
 * sharing a name, type, tier and description are one cosmetic's versions, 1,293 cards
 * (T7SEN, 2026-10-17). Every image is 296 by 176 pixels; 13 entries have none.
 */

const cosmeticSchema = z.object({
  customizing_item_id: numericId,
  customizing_item_name: z.string().min(1),
  customizing_item_type: z.string().min(1),
  /** Null for 156 entries, most of them the skins a Descendant starts with. */
  customizing_item_tier_id: z
    .string()
    .regex(/^Tier\d+$/)
    .nullable(),
  customizing_item_description: z.string(),
  customizing_item_image_url: nexonImageUrl.nullable(),
  customizing_item_evolution_stage: z.array(
    z.object({
      stage: z.number().int(),
      customizing_item_image_url: nexonImageUrl,
    }),
  ),
  available_descendant: z.array(numericId),
});

export type CosmeticRecord = z.infer<typeof cosmeticSchema>;

export interface CosmeticIndex {
  readonly cards: readonly CosmeticCard[];
  /** The Descendants the cards name, for the filter (`cosmeticDescendantOrder`). */
  readonly descendants: readonly CosmeticDescendant[];
}

const ultimatePrefix = "Ultimate ";

/**
 * Descendants by name, each Ultimate after its base: Bunny, Ultimate Bunny, Enzo; with
 * their portraits, by slug.
 */
export function cosmeticDescendantOrder(
  descendants: readonly DescendantLink[],
  portraits: ReadonlyMap<string, string>,
): CosmeticDescendant[] {
  const base = (name: string) =>
    name.startsWith(ultimatePrefix) ? name.slice(ultimatePrefix.length) : name;
  return [...descendants]
    .sort(
      (a, b) =>
        base(a.name).localeCompare(base(b.name)) ||
        Number(a.ultimate) - Number(b.ultimate),
    )
    .map((descendant) => ({
      slug: descendant.slug,
      name: descendant.name,
      imageUrl: portraits.get(descendant.slug) ?? "",
    }));
}

/**
 * Entries grouped into cards, in NEXON's id order. A version names the Descendants
 * `descendant.json` knows; others are left out. A card's address is its name and type,
 * with a number after it for a second cosmetic of the same name and type (Passion, a
 * Makeup for two pairs of Descendants, has two descriptions).
 */
export function cosmeticIndex(
  records: readonly CosmeticRecord[],
  links: ReadonlyMap<string, DescendantLink>,
  portraits: ReadonlyMap<string, string>,
): CosmeticIndex {
  const groups = new Map<string, CosmeticRecord[]>();
  const sorted = [...records].sort((a, b) =>
    a.customizing_item_id.localeCompare(b.customizing_item_id, "en", {
      numeric: true,
    }),
  );
  for (const record of sorted) {
    const key = [
      record.customizing_item_name,
      record.customizing_item_type,
      record.customizing_item_tier_id ?? "",
      record.customizing_item_description,
    ].join("\u0000");
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [record]);
    } else {
      group.push(record);
    }
  }

  const version = (record: CosmeticRecord): CosmeticVersion => ({
    id: record.customizing_item_id,
    imageUrl: record.customizing_item_image_url,
    stages: [...record.customizing_item_evolution_stage]
      .sort((a, b) => a.stage - b.stage)
      .map((stage) => stage.customizing_item_image_url),
    descendants: record.available_descendant.flatMap((id) => {
      const link = links.get(id);
      return link === undefined ? [] : [link.slug];
    }),
  });

  const taken = new Map<string, number>();
  const cards = [...groups.values()].flatMap((group): CosmeticCard[] => {
    const first = group.at(0);
    const rest = group.slice(1);
    if (first === undefined) {
      return [];
    }
    const type = first.customizing_item_type;
    const base = `${slugOf(first.customizing_item_name)}-${slugOf(cosmeticTypeName(type))}`;
    const count = (taken.get(base) ?? 0) + 1;
    taken.set(base, count);
    const versions: CosmeticCard["versions"] = [
      version(first),
      ...rest.map(version),
    ];
    return [
      {
        slug: count === 1 ? base : `${base}-${String(count)}`,
        name: first.customizing_item_name,
        type,
        tier: first.customizing_item_tier_id,
        description: first.customizing_item_description,
        everyone:
          everyDescendantTypes.includes(type) &&
          versions.every((entry) => entry.descendants.length === 0),
        versions,
      },
    ];
  });

  const named = new Set(
    cards.flatMap((card) =>
      card.versions.flatMap((entry) => entry.descendants),
    ),
  );
  return {
    cards,
    descendants: cosmeticDescendantOrder(
      [...links.values()].filter((link) => named.has(link.slug)),
      portraits,
    ),
  };
}

let indexPromise: Promise<CosmeticIndex> | null = null;

/** Every cosmetic, fetched once per build worker; none when NEXON can't be reached. */
export function fetchCosmetics(): Promise<CosmeticIndex> {
  indexPromise ??= Promise.all([
    fetchMetadataSet("customizing-item", cosmeticSchema),
    fetchDescendantLinks(),
    fetchDescendantSummaries(),
  ]).then(([records, links, summaries]) =>
    cosmeticIndex(
      records,
      links,
      new Map(summaries.map((summary) => [summary.slug, summary.imageUrl])),
    ),
  );
  return indexPromise;
}
