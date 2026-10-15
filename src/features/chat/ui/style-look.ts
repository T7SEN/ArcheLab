import type { CSSProperties } from "react";
import type { ChatRegistry, Style } from "@/features/chat/engine";

/** How a style looks in game, read from the registry. */
export interface StyleLook {
  /** A #RRGGBB color, or null for the channel's own color (untagged text). */
  readonly color: string | null;
  readonly bold: boolean;
  readonly italic: boolean;
  /** Text size relative to untagged text, from measured cap heights (X8, X9). */
  readonly scale: number;
}

const untagged: StyleLook = {
  color: null,
  bold: false,
  italic: false,
  scale: 1,
};

/**
 * The look of a style. Every style the builder can hold comes from the registry:
 * `parse` turns unknown tags into plain text, so the fallbacks never apply to a
 * real message.
 */
export function lookOf(style: Style | null, registry: ChatRegistry): StyleLook {
  if (style === null) {
    return untagged;
  }
  if (style.type === "size") {
    const size = registry.sizesById.get(style.id.toLowerCase());
    return size === undefined
      ? untagged
      : {
          ...untagged,
          color: size.hex,
          scale: size.capHeightPx / registry.data.untaggedText.capHeightPx,
        };
  }
  const tag = registry.tagsByName.get(style.name.toLowerCase());
  if (tag === undefined) {
    return untagged;
  }
  return {
    color: tag.hex,
    bold: tag.weight === "bold",
    italic: tag.slant === "italic",
    scale: 1,
  };
}

/** The look as React style props. A null color inherits the channel's color. */
export function stylePropsOf(look: StyleLook): CSSProperties {
  return {
    color: look.color ?? undefined,
    fontWeight: look.bold ? 700 : undefined,
    fontStyle: look.italic ? "italic" : undefined,
    fontSize: look.scale === 1 ? undefined : `${String(look.scale)}em`,
  };
}

/** The look as an inline CSS declaration list, for DOM rendered outside React. */
export function cssOf(look: StyleLook): string {
  const declarations: string[] = [];
  if (look.color !== null) {
    declarations.push(`color: ${look.color}`);
  }
  if (look.bold) {
    declarations.push("font-weight: 700");
  }
  if (look.italic) {
    declarations.push("font-style: italic");
  }
  if (look.scale !== 1) {
    declarations.push(`font-size: ${String(look.scale)}em`);
  }
  return declarations.join("; ");
}
