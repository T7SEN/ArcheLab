import { escapeAll, escapeMinimal } from "./escapes";
import { parse } from "./parse";
import { sameStyle, type Piece, type Style } from "./pieces";
import type { ChatRegistry, TagEntry } from "./registry";
import { metricsOf, render, sameGlyphs } from "./render";
import { closeTag, imageTag, openTag, serialize } from "./serialize";

type Escaping = "minimal" | "all";

/**
 * For each tag, the shortest tag that renders the same: same color, weight and slant.
 * For example `<default>` and `<QuestEvent>` become `<Plain>` (SPEC.md section 4.1).
 * Ties go to the earlier registry entry.
 */
function shortestEquivalents(registry: ChatRegistry): Map<string, string> {
  const best = new Map<string, TagEntry>();
  const keyOf = (tag: TagEntry): string =>
    `${tag.hex ?? `none:${tag.name}`}|${tag.weight}|${tag.slant}`;
  for (const tag of registry.data.tags) {
    const current = best.get(keyOf(tag));
    if (current === undefined || tag.name.length < current.name.length) {
      best.set(keyOf(tag), tag);
    }
  }
  const shortest = new Map<string, string>();
  for (const tag of registry.data.tags) {
    shortest.set(
      tag.name.toLowerCase(),
      best.get(keyOf(tag))?.name ?? tag.name,
    );
  }
  return shortest;
}

function canonicalStyle(
  style: Style | null,
  registry: ChatRegistry,
  shortest: ReadonlyMap<string, string>,
): Style | null {
  if (style === null) {
    return null;
  }
  if (style.type === "size") {
    return {
      type: "size",
      id: registry.sizesById.get(style.id.toLowerCase())?.id ?? style.id,
    };
  }
  return {
    type: "tag",
    name: shortest.get(style.name.toLowerCase()) ?? style.name,
  };
}

const allWhitespace = /^\p{White_Space}+$/u;

/** Merges neighbors with the same style and drops empty text. */
function mergeNeighbors(pieces: readonly Piece[]): Piece[] {
  const merged: Piece[] = [];
  for (const piece of pieces) {
    if (piece.kind === "text" && piece.text === "") {
      continue;
    }
    const last = merged.at(-1);
    if (
      piece.kind === "text" &&
      last?.kind === "text" &&
      sameStyle(last.style, piece.style)
    ) {
      merged[merged.length - 1] = {
        kind: "text",
        text: last.text + piece.text,
        style: piece.style,
      };
    } else {
      merged.push(piece);
    }
  }
  return merged;
}

/**
 * Restyles whitespace-only text when that saves markup without changing how it looks.
 * Whitespace looks the same in any color with the same weight, slant and size.
 */
function absorbWhitespace(
  pieces: readonly Piece[],
  registry: ChatRegistry,
): Piece[] {
  let current = mergeNeighbors(pieces);
  // Bounds-checked: unlike `.at()`, index -1 must mean "no neighbor", not the last piece.
  const pieceAt = (index: number): Piece | undefined =>
    index >= 0 && index < current.length ? current[index] : undefined;
  let changed = true;
  while (changed) {
    changed = false;
    for (let index = 0; index < current.length; index += 1) {
      const piece = pieceAt(index);
      if (piece?.kind !== "text" || !allWhitespace.test(piece.text)) {
        continue;
      }
      const metrics = metricsOf(piece.style, registry);
      const left = pieceAt(index - 1);
      const right = pieceAt(index + 1);
      let target: Style | null | undefined;
      if (
        left?.kind === "text" &&
        right?.kind === "text" &&
        sameStyle(left.style, right.style) &&
        !sameStyle(left.style, piece.style) &&
        metricsOf(left.style, registry) === metrics
      ) {
        target = left.style;
      } else if (
        piece.style !== null &&
        metricsOf(null, registry) === metrics
      ) {
        target = null;
      }
      if (target !== undefined) {
        current[index] = { kind: "text", text: piece.text, style: target };
        current = mergeNeighbors(current);
        changed = true;
        break;
      }
    }
  }
  return current;
}

function simplify(pieces: readonly Piece[], registry: ChatRegistry): Piece[] {
  const shortest = shortestEquivalents(registry);
  const canonical = pieces.map((piece): Piece =>
    piece.kind === "image"
      ? {
          kind: "image",
          id: registry.imagesById.get(piece.id.toLowerCase())?.id ?? piece.id,
        }
      : {
          kind: "text",
          text: piece.text,
          style: canonicalStyle(piece.style, registry, shortest),
        },
  );
  return absorbWhitespace(canonical, registry);
}

function emit(pieces: readonly Piece[], escaping: Escaping): string {
  let out = "";
  for (const piece of pieces) {
    if (piece.kind === "image") {
      out += imageTag(piece.id);
      continue;
    }
    const context = piece.style === null ? "untagged" : "run";
    const text =
      escaping === "all"
        ? escapeAll(piece.text)
        : escapeMinimal(piece.text, context);
    out += piece.style === null ? text : openTag(piece.style) + text + closeTag;
  }
  return out;
}

/**
 * The shortest markup this engine finds that renders identically to `pieces`
 * (invariant 2) and is never longer than `serialize(pieces)` (invariant 3):
 * - each tag becomes its shortest same-looking equivalent;
 * - neighboring runs with the same style merge, including across whitespace;
 * - only characters that would otherwise form markup are escaped.
 * Every candidate is checked by parsing it back. If a candidate would render
 * differently, the next safer one is used, ending with `serialize`.
 */
export function optimize(
  pieces: readonly Piece[],
  registry: ChatRegistry,
): string {
  const target = render(pieces, registry);
  const simplified = simplify(pieces, registry);
  const fallback = serialize(pieces);
  for (const candidate of [
    emit(simplified, "minimal"),
    emit(simplified, "all"),
  ]) {
    const fits = candidate.length <= fallback.length;
    if (
      fits &&
      sameGlyphs(render(parse(candidate, registry), registry), target)
    ) {
      return candidate;
    }
  }
  return fallback;
}
