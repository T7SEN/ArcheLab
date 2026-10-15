import { Fragment, type Node as ProseMirrorNode } from "prosemirror-model";
import type { Glyph, Piece } from "@/features/chat/engine";
import { appendText } from "@/features/chat/engine/pieces";
import type { EditorSchema } from "./editor-schema";
import { attrsOf, styleFromAttrs } from "./style-attrs";

/** Builds editor content from engine pieces. */
export function fragmentFromPieces(
  schema: EditorSchema,
  pieces: readonly Piece[],
): Fragment {
  const nodes: ProseMirrorNode[] = [];
  for (const piece of pieces) {
    if (piece.kind === "image") {
      nodes.push(schema.nodes.image.create({ id: piece.id }));
    } else if (piece.text !== "") {
      const marks =
        piece.style === null
          ? []
          : [schema.marks.style.create(attrsOf(piece.style))];
      nodes.push(schema.text(piece.text, marks));
    }
  }
  return Fragment.from(nodes);
}

export function docFromPieces(
  schema: EditorSchema,
  pieces: readonly Piece[],
): ProseMirrorNode {
  return schema.nodes.doc.create(null, fragmentFromPieces(schema, pieces));
}

/**
 * Reads engine pieces out of editor content. Neighbors with the same style merge, and
 * any mark on an image is ignored: images never sit inside a run (T26).
 */
export function piecesFromFragment(fragment: Fragment): Piece[] {
  const pieces: Piece[] = [];
  fragment.forEach((node) => {
    if (node.type.name === "image") {
      pieces.push({ kind: "image", id: String(node.attrs.id) });
      return;
    }
    if (node.isText) {
      const mark = node.marks.find((entry) => entry.type.name === "style");
      appendText(
        pieces,
        node.text ?? "",
        mark === undefined ? null : styleFromAttrs(mark.attrs),
      );
    }
  });
  return pieces;
}

/**
 * The document position just before glyph `glyphIndex`. Glyphs advance one code
 * point at a time, as `render` produces them; positions count UTF-16 units, and
 * an image counts 1.
 */
export function positionOfGlyph(
  doc: ProseMirrorNode,
  glyphIndex: number,
): number {
  let glyphs = 0;
  let position = 0;
  for (let child = 0; child < doc.childCount; child += 1) {
    const node = doc.child(child);
    // An image is one glyph; text is one glyph per code point, exactly as
    // `render` iterates it (not per grapheme).
    const units: (string | null)[] = node.isText
      ? Array.from(node.text ?? "")
      : [null];
    for (const char of units) {
      if (glyphs === glyphIndex) {
        return position;
      }
      glyphs += 1;
      position += char === null ? node.nodeSize : char.length;
    }
  }
  return position;
}

function sameGlyph(a: Glyph, b: Glyph): boolean {
  if (a.kind === "image") {
    return b.kind === "image" && a.id === b.id;
  }
  return b.kind === "char" && a.char === b.char && a.look === b.look;
}

/** How many leading glyphs two renderings share. */
export function commonGlyphPrefix(
  a: readonly Glyph[],
  b: readonly Glyph[],
): number {
  let index = 0;
  for (const glyph of a) {
    const other = b.at(index);
    if (other === undefined || !sameGlyph(glyph, other)) {
      break;
    }
    index += 1;
  }
  return index;
}
