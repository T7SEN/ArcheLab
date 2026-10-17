import { mutantCellSlug, type MutantCell } from "@/data/mutant-cells";
import type { PaletteMutantCell } from "./site-commands";

/**
 * The Mutant Cells the palette offers, as plain data for the server layout to hand the
 * client provider (ADR 0022, ADR 0038, ADR 0040): 64 rows, from NEXON's set. Each opens its details on the Mutant
 * Cells page, A–Z, with its socket beside it.
 */
export function paletteMutantCells(
  cells: readonly MutantCell[],
): PaletteMutantCell[] {
  return cells
    .map((cell) => ({
      name: cell.name,
      href: `/mutant-cells?cell=${mutantCellSlug(cell.name)}`,
      socket: cell.socket,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
