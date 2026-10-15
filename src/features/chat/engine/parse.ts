import { decodeEscapes } from "./escapes";
import { appendText, type Piece } from "./pieces";
import type { ChatRegistry } from "./registry";

/**
 * The markup pattern of Unreal Engine's standard rich-text parser
 * (FDefaultRichTextMarkupParser), translated to JavaScript:
 *   <([\w\d\.-]+)((?: (?:[\w\d\.-]+=(?>\".*?\")))+)?(?:(?:/>)|(?:>(.*?)</>))
 * Every in-game test matched this parser (reports/TFD in-game chat tests.md, Parts 1
 * and 2): `</>` is the only closer, the first `</>` ends a run, runs do not nest, and
 * a space inside the brackets breaks the tag. `.` never matches a line break.
 */
const nameChar = String.raw`[\p{L}\p{M}\p{Nd}\p{Pc}.\-]`;
const markupPattern = new RegExp(
  String.raw`<(${nameChar}+)((?: ${nameChar}+="[^"\n]*")+)?(?:\/>|>([^\n]*?)<\/>)`,
  "gu",
);
const attributePattern = new RegExp(
  String.raw` (${nameChar}+)="([^"\n]*)"`,
  "gu",
);

/** Attribute names ignore case in game (T15). */
function readAttributes(text: string | undefined): Map<string, string> {
  const attributes = new Map<string, string>();
  if (text === undefined) {
    return attributes;
  }
  // Both groups are mandatory in the pattern, so they are always strings.
  for (const [, name, value] of text.matchAll(attributePattern)) {
    attributes.set(name.toLowerCase(), value);
  }
  return attributes;
}

/**
 * Resolves one well-formed tag. Returns null when the game would show it as typed:
 * unknown tag names (T16), unknown image ids (T17), unknown size ids.
 */
function resolveTag(
  name: string,
  attributes: ReadonlyMap<string, string>,
  content: string | undefined,
  registry: ChatRegistry,
): Piece[] | null {
  const lower = name.toLowerCase();
  const id = attributes.get("id")?.toLowerCase();

  if (lower === "img") {
    const image = id === undefined ? undefined : registry.imagesById.get(id);
    // Unreal's image decorator ignores any content (inferred; the game was tested with
    // the self-closing and empty forms, T6 and T7).
    return image === undefined ? null : [{ kind: "image", id: image.id }];
  }

  const text = decodeEscapes(content ?? "");
  if (lower === "a") {
    const size = id === undefined ? undefined : registry.sizesById.get(id);
    if (size === undefined) {
      return null;
    }
    return text === ""
      ? []
      : [{ kind: "text", text, style: { type: "size", id: size.id } }];
  }

  const tag = registry.tagsByName.get(lower);
  if (tag === undefined) {
    return null;
  }
  return text === ""
    ? []
    : [{ kind: "text", text, style: { type: "tag", name: tag.name } }];
}

/**
 * Reads chat markup the way the game renders it. Never throws: anything that is not a
 * well-formed, known tag is shown as typed, with escapes decoded (T4, T5, T16, T28).
 */
export function parse(markup: string, registry: ChatRegistry): Piece[] {
  const pieces: Piece[] = [];
  let cursor = 0;
  for (const match of markup.matchAll(markupPattern)) {
    const whole = match[0];
    // Group 1 (the name) is mandatory. Groups 2 (attributes) and 3 (content) are
    // optional and undefined at runtime when absent, whatever TypeScript infers.
    const name = match[1];
    const attributeText: string | undefined = match[2];
    const content: string | undefined = match[3];

    appendText(pieces, decodeEscapes(markup.slice(cursor, match.index)), null);
    const resolved = resolveTag(
      name,
      readAttributes(attributeText),
      content,
      registry,
    );
    if (resolved === null) {
      appendText(pieces, decodeEscapes(whole), null);
    } else {
      for (const piece of resolved) {
        if (piece.kind === "text") {
          appendText(pieces, piece.text, piece.style);
        } else {
          pieces.push(piece);
        }
      }
    }
    cursor = match.index + whole.length;
  }
  appendText(pieces, decodeEscapes(markup.slice(cursor)), null);
  return pieces;
}
