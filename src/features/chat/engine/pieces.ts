/** How a run of text is styled: a named tag (color, bold, italic) or a text size. */
export type Style =
  | { readonly type: "tag"; readonly name: string }
  | { readonly type: "size"; readonly id: string };

/**
 * One piece of a chat message. Untagged text has `style: null` and shows in the
 * channel's color. Images always sit outside styled runs (T26).
 */
export type Piece =
  | {
      readonly kind: "text";
      readonly text: string;
      readonly style: Style | null;
    }
  | { readonly kind: "image"; readonly id: string };

export function sameStyle(a: Style | null, b: Style | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  if (a.type === "tag") {
    return b.type === "tag" && a.name === b.name;
  }
  return b.type === "size" && a.id === b.id;
}

/** Appends text to a piece list, merging with the previous piece when the style matches. */
export function appendText(
  pieces: Piece[],
  text: string,
  style: Style | null,
): void {
  if (text === "") {
    return;
  }
  const last = pieces.at(-1);
  if (last?.kind === "text" && sameStyle(last.style, style)) {
    pieces[pieces.length - 1] = { kind: "text", text: last.text + text, style };
    return;
  }
  pieces.push({ kind: "text", text, style });
}
