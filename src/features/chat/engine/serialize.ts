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
 *
 * Neighboring untagged pieces are escaped together: the game decodes their text as one
 * stretch, so `&` then `lt;` must become `&amp;lt;`, not `&lt;`, which shows as `<`.
 */
export function serialize(pieces: readonly Piece[]): string {
  let out = "";
  // Untagged text waiting to be escaped, until a run or an image ends the stretch.
  let untagged = "";
  for (const piece of pieces) {
    if (piece.kind === "image") {
      out += escapeAll(untagged) + imageTag(piece.id);
      untagged = "";
    } else if (piece.text === "") {
      continue;
    } else if (piece.style === null) {
      untagged += piece.text;
    } else {
      out +=
        escapeAll(untagged) +
        openTag(piece.style) +
        escapeAll(piece.text) +
        closeTag;
      untagged = "";
    }
  }
  return out + escapeAll(untagged);
}
