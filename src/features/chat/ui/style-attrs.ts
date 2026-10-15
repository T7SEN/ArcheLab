import type { Attrs } from "prosemirror-model";
import type { Style } from "@/features/chat/engine";

/** A style as ProseMirror mark attributes: plain strings, so they copy and compare. */
export interface StyleAttrs {
  readonly type: "tag" | "size";
  readonly name: string;
}

export function attrsOf(style: Style): StyleAttrs {
  return style.type === "tag"
    ? { type: "tag", name: style.name }
    : { type: "size", name: style.id };
}

/** Reads a style back from mark attributes, or null if they are not a style. */
export function styleFromAttrs(attrs: Attrs): Style | null {
  const type: unknown = attrs.type;
  const name: unknown = attrs.name;
  if (typeof name !== "string" || name === "") {
    return null;
  }
  if (type === "tag") {
    return { type: "tag", name };
  }
  if (type === "size") {
    return { type: "size", id: name };
  }
  return null;
}
