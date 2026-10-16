import type { DescendantLink } from "@/lib/nexon/descendant-page";
import type { PaletteDescendant } from "./site-commands";

/**
 * The Descendants the palette offers, as plain data for the server layout to hand the
 * client provider: each one opens its page, A–Z (ADR 0022, ADR 0023).
 */
export function paletteDescendants(
  descendants: readonly DescendantLink[],
): PaletteDescendant[] {
  return descendants
    .map((descendant) => ({
      name: descendant.name,
      href: `/descendants/${descendant.slug}`,
      ultimate: descendant.ultimate,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
