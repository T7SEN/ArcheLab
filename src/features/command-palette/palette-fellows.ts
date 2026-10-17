import { fellowPassiveOf, fellowPassives } from "@/data/fellows";
import { rarityOf } from "@/features/game-data/rarity";
import type { FellowGroup } from "@/lib/nexon/fellow-index";
import type { PaletteFellow } from "./site-commands";

/**
 * The Fellows the palette offers, as plain data for the server layout to hand the
 * client provider (ADR 0022, ADR 0035): 3 rows. Each opens its details on the Fellows page,
 * A–Z, with its tier and passive beside it.
 */
export function paletteFellows(
  fellows: readonly FellowGroup[],
): PaletteFellow[] {
  return fellows
    .map((fellow) => {
      const passive = fellowPassiveOf[fellow.name];
      return {
        name: fellow.name,
        href: `/fellows?fellow=${fellow.slug}`,
        tier: rarityOf(fellow.tier)?.name ?? fellow.tier,
        passive: passive === undefined ? null : fellowPassives[passive].name,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
