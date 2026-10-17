/**
 * Character escapes. The game decodes `&lt;` and `&gt;` in chat (T28). Unreal's
 * standard parser, which every other verified behavior matches, also decodes
 * `&quot;` and `&amp;`, and both are verified too (2026-10-17): `&quot;` shows as `"`
 * (T48) and `&amp;` as `&` (T46), though messages holding `&amp;` are usually refused by
 * the banned-word filter (T45, T46), while a plain `&` is not (T47).
 */
const escapeValues: ReadonlyMap<string, string> = new Map([
  ["quot", '"'],
  ["lt", "<"],
  ["gt", ">"],
  ["amp", "&"],
]);

const escapePattern = /&(quot|lt|gt|amp);/g;

/** Decodes escapes left to right in one pass, as the game shows them. */
export function decodeEscapes(text: string): string {
  return text.replace(
    escapePattern,
    (whole, name: string) => escapeValues.get(name) ?? whole,
  );
}

const escapeNameAhead = /^(?:quot|lt|gt|amp);/;

/** An ampersand needs escaping only when it would start one of the four escapes. */
function escapeAmpersand(rest: string): string {
  return escapeNameAhead.test(rest) ? "&amp;" : "&";
}

/**
 * Escapes text so it can never be read as markup: every `<` becomes `&lt;`, and a `&`
 * that would start an escape becomes `&amp;`. Safe anywhere, but costs characters.
 */
export function escapeAll(text: string): string {
  let out = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (char === "<") {
      out += "&lt;";
    } else if (char === "&") {
      out += escapeAmpersand(text.slice(index + 1));
    } else {
      out += char;
    }
  }
  return out;
}

/** Where escaped text will sit: untagged, or inside a styled run `<tag>…</>`. */
export type TextContext = "untagged" | "run";

const tagNameStart = /^[\p{L}\p{M}\p{Nd}\p{Pc}.-]/u;

/**
 * Escapes only what is likely to matter. Untagged: a `<` that could open a tag
 * (followed by a name character). Inside a run: only a `<` that would close it early
 * (`</>`). Ampersands as in `escapeAll`. The optimizer verifies the result by parsing
 * it and falls back to `escapeAll` if it renders differently.
 */
export function escapeMinimal(text: string, context: TextContext): string {
  let out = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    const rest = text.slice(index + 1);
    const opensMarkup =
      context === "untagged" ? tagNameStart.test(rest) : rest.startsWith("/>");
    if (char === "<" && opensMarkup) {
      out += "&lt;";
    } else if (char === "&") {
      out += escapeAmpersand(rest);
    } else {
      out += char;
    }
  }
  return out;
}
