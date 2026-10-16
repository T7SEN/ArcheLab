import type { ReactorGroup } from "@/lib/nexon/reactor-index";
import type { PaletteReactor } from "./site-commands";

/**
 * The reactors the palette offers, as plain data for the server layout to hand the
 * client provider (ADR 0022, ADR 0026): 20 rows, small enough to come with every page.
 * Each opens its details on the reactors index, A–Z.
 */
export function paletteReactors(
  reactors: readonly ReactorGroup[],
): PaletteReactor[] {
  return reactors
    .map((reactor) => ({
      name: reactor.name,
      href: `/reactors?reactor=${reactor.slug}`,
      attribute: reactor.attribute,
      archeType: reactor.archeType,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
