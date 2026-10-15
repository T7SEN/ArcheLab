import type { ChatRegistry } from "./registry";

/** Whether the game shows a character: verified, refused, or not yet tested. */
export type CharacterStatus = "ok" | "unverified" | "refused";

export interface CharacterIssue {
  /** Position in UTF-16 units, the game's counting unit (T23). */
  readonly index: number;
  readonly char: string;
  readonly status: Exclude<CharacterStatus, "ok">;
}

export interface CountResult {
  /** Characters used, counting every tag (T20, T21) in UTF-16 units. */
  readonly used: number;
  readonly limit: number;
  readonly remaining: number;
  /** Where the input box cuts the message, or null when it fits (T19). */
  readonly overflowAt: number | null;
  /** Characters the game refuses, and characters not yet tested. */
  readonly issues: readonly CharacterIssue[];
}

const lastBmpCodePoint = 0xffff;
const printableAscii = { first: 0x20, last: 0x7e } as const;
/** Hangul syllables. Only 가 was tested (T22); the rest of the block is inferred. */
const hangulSyllables = { first: 0xac00, last: 0xd7a3 } as const;

function within(
  codePoint: number,
  range: { first: number; last: number },
): boolean {
  return codePoint >= range.first && codePoint <= range.last;
}

/**
 * Classifies one character (a full code point). Characters outside the Basic
 * Multilingual Plane, such as emoji, and the listed symbols make the game refuse the
 * message (T23, T43). Support is per character, not per Unicode block, so anything
 * not verified is "unverified".
 */
export function classifyCharacter(
  char: string,
  registry: ChatRegistry,
): CharacterStatus {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) {
    return "ok";
  }
  const { characters } = registry.data;
  if (
    (characters.refuseOutsideBmp && codePoint > lastBmpCodePoint) ||
    characters.refused.includes(char)
  ) {
    return "refused";
  }
  if (
    within(codePoint, printableAscii) ||
    within(codePoint, hangulSyllables) ||
    characters.verifiedSymbols.includes(char)
  ) {
    return "ok";
  }
  return "unverified";
}

/**
 * Where the input box cuts `markup`: the first character that does not fully fit in the
 * limit. An emoji (2 units) that would end past the limit is dropped whole (T23).
 */
function cutPosition(markup: string, limit: number): number | null {
  if (markup.length <= limit) {
    return null;
  }
  let position = 0;
  for (const char of markup) {
    if (position + char.length > limit) {
      return position;
    }
    position += char.length;
  }
  return null;
}

/** Counts a message the way the game does: every character of markup, in UTF-16 units. */
export function count(markup: string, registry: ChatRegistry): CountResult {
  const limit = registry.charLimit;
  const issues: CharacterIssue[] = [];
  let index = 0;
  for (const char of markup) {
    const status = classifyCharacter(char, registry);
    if (status !== "ok") {
      issues.push({ index, char, status });
    }
    index += char.length;
  }
  return {
    used: markup.length,
    limit,
    remaining: limit - markup.length,
    overflowAt: cutPosition(markup, limit),
    issues,
  };
}

/** What the input box keeps when `markup` is pasted (T19, T20, T21, T23). */
export function truncateToLimit(
  markup: string,
  registry: ChatRegistry,
): string {
  const cut = cutPosition(markup, registry.charLimit);
  return cut === null ? markup : markup.slice(0, cut);
}
