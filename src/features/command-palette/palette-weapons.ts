import { rarityOf } from "@/features/game-data/rarity";
import type { WeaponSummary } from "@/lib/nexon/weapon-page";
import type { PaletteWeapon } from "./site-commands";

/**
 * The weapons the palette offers, as plain data for the server layout to hand the client
 * provider: each one opens its page, A–Z, with its tier's rarity name (ADR 0022, ADR 0024).
 * The rarity comes from the chat registry here, so the browser never loads it.
 */
export function paletteWeapons(
  weapons: readonly WeaponSummary[],
): PaletteWeapon[] {
  return weapons
    .map((weapon) => ({
      name: weapon.name,
      href: `/weapons/${weapon.slug}`,
      tier: rarityOf(weapon.tier)?.name ?? weapon.tier,
      type: weapon.type,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
