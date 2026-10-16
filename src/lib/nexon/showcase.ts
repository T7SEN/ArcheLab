import "server-only";
import { z } from "zod";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";

/**
 * The home page's Descendant and weapon carousels (ADR 0018): data from NEXON's
 * metadata. Each schema reads only the fields the carousels use, so other changes to
 * NEXON's data never matter here; a missing or malformed field drops that entry.
 */

const descendantSchema = z.object({
  descendant_id: z.string().regex(/^\d+$/),
  descendant_name: z.string().min(1),
  descendant_group_id: z.string().min(1),
  descendant_image_url: nexonImageUrl,
});

const weaponSchema = z.object({
  weapon_id: z.string().regex(/^\d+$/),
  weapon_name: z.string().min(1),
  weapon_type: z.string().min(1),
  weapon_rounds_type: z.string().min(1),
  weapon_tier_id: z.string().regex(/^Tier\d+$/),
  image_url: nexonImageUrl,
});

export type DescendantEntry = z.infer<typeof descendantSchema>;
export type WeaponEntry = z.infer<typeof weaponSchema>;

export interface DescendantItem {
  readonly name: string;
  readonly imageUrl: string;
  /** Named "Ultimate …" in NEXON's data. */
  readonly ultimate: boolean;
}

export interface WeaponItem {
  readonly name: string;
  readonly imageUrl: string;
  readonly type: string;
  readonly roundsType: string;
}

export interface DescendantShowcase {
  /**
   * Every Descendant, newest first. NEXON's ids rise with each release (checked
   * 2026-10-16: the four highest are the four newest Descendants).
   */
  readonly items: readonly DescendantItem[];
  /** Descendant groups: a base Descendant and its Ultimates count once. */
  readonly groups: number;
  readonly ultimates: number;
}

export interface WeaponShowcase {
  /**
   * One per weapon type, at its highest tier, the earliest in NEXON's order on a tie.
   * Weapon ids follow weapon categories, not release order, so there is no "newest".
   */
  readonly items: readonly WeaponItem[];
  readonly total: number;
  readonly types: number;
}

export function descendantShowcase(
  entries: readonly DescendantEntry[],
): DescendantShowcase {
  const items = [...entries]
    .sort((a, b) => Number(b.descendant_id) - Number(a.descendant_id))
    .map((entry) => ({
      name: entry.descendant_name,
      imageUrl: entry.descendant_image_url,
      ultimate: entry.descendant_name.startsWith("Ultimate "),
    }));
  return {
    items,
    groups: new Set(entries.map((entry) => entry.descendant_group_id)).size,
    ultimates: items.filter((item) => item.ultimate).length,
  };
}

export function weaponShowcase(
  entries: readonly WeaponEntry[],
): WeaponShowcase {
  const tier = (entry: WeaponEntry): number =>
    Number(entry.weapon_tier_id.slice("Tier".length));
  const best = new Map<string, WeaponEntry>();
  for (const entry of [...entries].sort(
    (a, b) => Number(a.weapon_id) - Number(b.weapon_id),
  )) {
    const current = best.get(entry.weapon_type);
    if (current === undefined || tier(entry) > tier(current)) {
      best.set(entry.weapon_type, entry);
    }
  }
  return {
    items: [...best.values()].map((entry) => ({
      name: entry.weapon_name,
      imageUrl: entry.image_url,
      type: entry.weapon_type,
      roundsType: entry.weapon_rounds_type,
    })),
    total: entries.length,
    types: best.size,
  };
}

/** Both carousels' data, fetched while the home page is prerendered. Either may be empty. */
export async function fetchShowcase(): Promise<{
  descendants: DescendantShowcase;
  weapons: WeaponShowcase;
}> {
  const [descendants, weapons] = await Promise.all([
    fetchMetadataSet("descendant", descendantSchema),
    fetchMetadataSet("weapon", weaponSchema),
  ]);
  return {
    descendants: descendantShowcase(descendants),
    weapons: weaponShowcase(weapons),
  };
}
