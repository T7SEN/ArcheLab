import { rarityOf } from "@/features/game-data/rarity";
import type { ComponentGroup } from "@/lib/nexon/component-index";
import type { PaletteComponent } from "./site-commands";

/**
 * The external components the palette offers, as plain data for the server layout to
 * hand the client provider (ADR 0022, ADR 0027): 39 short rows, small enough to come
 * with every page. Each opens its details on the index, A–Z.
 */
export function paletteComponents(
  groups: readonly ComponentGroup[],
): PaletteComponent[] {
  return groups
    .map((group) => {
      const tiers = [
        ...new Set(
          group.pieces.map((piece) => rarityOf(piece.tier)?.name ?? piece.tier),
        ),
      ];
      // The pieces' names without their slots: "Volcanic" finds Active Volcano.
      const names = new Set(
        group.pieces.map((piece) =>
          piece.name.endsWith(` ${piece.slot}`)
            ? piece.name.slice(0, -piece.slot.length - 1)
            : piece.name,
        ),
      );
      names.delete(group.name);
      return {
        name: group.name,
        href: `/external-components?component=${group.slug}`,
        hint:
          group.kind === "set"
            ? (tiers.at(0) ?? "Set")
            : `${String(tiers.length)} tiers`,
        keywords: [...tiers, ...names],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
