import type { Piece, Style } from "./pieces";
import type { ChatRegistry } from "./registry";

/** One rendered character or image, with what it looks like. */
export type Glyph =
  | { readonly kind: "char"; readonly char: string; readonly look: string }
  | { readonly kind: "image"; readonly id: string };

interface Appearance {
  /** A #RRGGBB color, or "channel" for untagged text (its color depends on the channel). */
  readonly color: string;
  /** Weight, slant and size together: what changes a character's shape and width. */
  readonly metrics: string;
}

const untagged: Appearance = {
  color: "channel",
  metrics: "regular|normal|untagged",
};

function appearanceOf(style: Style | null, registry: ChatRegistry): Appearance {
  if (style === null) {
    return untagged;
  }
  if (style.type === "size") {
    const size = registry.sizesById.get(style.id.toLowerCase());
    return size === undefined
      ? {
          color: `unknown-size:${style.id}`,
          metrics: `unknown-size:${style.id}`,
        }
      : { color: size.hex, metrics: `regular|normal|${size.id}` };
  }
  const tag = registry.tagsByName.get(style.name.toLowerCase());
  if (tag === undefined) {
    return {
      color: `unknown-tag:${style.name}`,
      metrics: "regular|normal|untagged",
    };
  }
  return {
    color: tag.hex ?? `unknown-color:${tag.name}`,
    metrics: `${tag.weight}|${tag.slant}|untagged`,
  };
}

/** The shape part of a style's look: weight, slant and size, without color. */
export function metricsOf(style: Style | null, registry: ChatRegistry): string {
  return appearanceOf(style, registry).metrics;
}

const whitespace = /^\p{White_Space}$/u;

/**
 * Renders pieces into glyphs. "Renders identically" (SKILL.md section 5.2) compares
 * these. A visible character's look is its color and shape. A whitespace character's
 * look is only its shape, because a space in red and a space in blue look the same;
 * that is what lets the optimizer merge same-color runs across spaces.
 */
export function render(
  pieces: readonly Piece[],
  registry: ChatRegistry,
): Glyph[] {
  const glyphs: Glyph[] = [];
  for (const piece of pieces) {
    if (piece.kind === "image") {
      glyphs.push({ kind: "image", id: piece.id.toLowerCase() });
      continue;
    }
    const appearance = appearanceOf(piece.style, registry);
    for (const char of piece.text) {
      const look = whitespace.test(char)
        ? appearance.metrics
        : `${appearance.color}|${appearance.metrics}`;
      glyphs.push({ kind: "char", char, look });
    }
  }
  return glyphs;
}

/** Whether a glyph list holds the same characters and images, looking the same. */
export function sameGlyphs(a: readonly Glyph[], b: readonly Glyph[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((glyph, index) => {
    // `index` is within both lists: they have the same length.
    const other = b.at(index);
    if (other === undefined) {
      return false;
    }
    if (glyph.kind === "image") {
      return other.kind === "image" && glyph.id === other.id;
    }
    return (
      other.kind === "char" &&
      glyph.char === other.char &&
      glyph.look === other.look
    );
  });
}

export function rendersIdentically(
  a: readonly Piece[],
  b: readonly Piece[],
  registry: ChatRegistry,
): boolean {
  return sameGlyphs(render(a, registry), render(b, registry));
}
