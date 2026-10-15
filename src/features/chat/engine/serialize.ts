import { escapeAll } from "./escapes";
import type { Piece, Style } from "./pieces";

/** The opening markup for a style. Every run closes with `</>` (T1). */
export function openTag(style: Style): string {
  return style.type === "tag" ? `<${style.name}>` : `<a id="${style.id}">`;
}

export const closeTag = "</>";

/** Image markup in its short form, 2 characters shorter than `<img id=""></>` (T6, T7). */
export function imageTag(id: string): string {
  return `<img id="${id}"/>`;
}

/**
 * Writes pieces as markup in canonical form: every run opened and closed, every `<`
 * escaped. `parse(serialize(pieces))` renders identically to `pieces` (invariant 1).
 * Empty runs are dropped because they render nothing.
 */
export function serialize(pieces: readonly Piece[]): string {
  let out = "";
  for (const piece of pieces) {
    if (piece.kind === "image") {
      out += imageTag(piece.id);
    } else if (piece.text === "") {
      continue;
    } else if (piece.style === null) {
      out += escapeAll(piece.text);
    } else {
      out += openTag(piece.style) + escapeAll(piece.text) + closeTag;
    }
  }
  return out;
}
