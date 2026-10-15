import registryData from "../../../data/chat-tags.json";
import type { Piece } from "./pieces";
import { createRegistry } from "./registry";

/** The real registry, as the app uses it. */
export const registry = createRegistry(registryData);

/**
 * A compact view of pieces for assertions: untagged text as is, styled runs as
 * `[name:text]` or `[a#id:text]`, images as `{id}`.
 */
export function show(pieces: readonly Piece[]): string {
  return pieces
    .map((piece) => {
      if (piece.kind === "image") {
        return `{${piece.id}}`;
      }
      if (piece.style === null) {
        return piece.text;
      }
      const name =
        piece.style.type === "tag" ? piece.style.name : `a#${piece.style.id}`;
      return `[${name}:${piece.text}]`;
    })
    .join("");
}

/**
 * The rulers from Part 3 of the test sheet: twelve groups of nine filler characters,
 * each followed by a letter, so every 10th character is A, B, C and so on.
 */
export function ruler(filler: string): string {
  return "ABCDEFGHIJKL"
    .split("")
    .map((letter) => filler + letter)
    .join("");
}
