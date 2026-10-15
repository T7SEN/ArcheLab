import { classifyCharacter, type ChatRegistry } from "@/features/chat/engine";

export interface CleanedMarkup {
  readonly markup: string;
  /** Characters removed because the game refuses them (T23, T43). */
  readonly refused: readonly string[];
}

/**
 * Prepares text typed or pasted into the markup panel: chat is one line, so line
 * breaks become spaces, and characters the game refuses are removed.
 */
export function cleanMarkup(
  text: string,
  registry: ChatRegistry,
): CleanedMarkup {
  const refused: string[] = [];
  let markup = "";
  for (const char of text.replace(/\r\n?|\n/g, " ")) {
    if (classifyCharacter(char, registry) === "refused") {
      refused.push(char);
    } else {
      markup += char;
    }
  }
  return { markup, refused };
}

/** The notice shown when characters were removed. */
export function refusedNotice(chars: readonly string[]): string {
  const unique = [...new Set(chars)];
  return unique.length === 1
    ? `Removed ${unique.join(" ")}: the game refuses this character.`
    : `Removed ${unique.join(" ")}: the game refuses these characters.`;
}
