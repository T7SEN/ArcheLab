/** The parts of a key event the palette's shortcut reads. */
export type ShortcutEvent = Pick<
  KeyboardEvent,
  "key" | "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "isComposing"
>;

/**
 * Ctrl+K, or ⌘K on a Mac, without Shift or Alt and not while an input method is
 * composing (ADR 0022). In layouts that type Latin letters the K is the letter K,
 * wherever it sits (Dvorak). In other layouts, such as Arabic, the same key types
 * another letter, so the key's position counts instead.
 */
export function isPaletteShortcut(event: ShortcutEvent): boolean {
  if (
    !(event.ctrlKey || event.metaKey) ||
    event.altKey ||
    event.shiftKey ||
    event.isComposing
  ) {
    return false;
  }
  const key = event.key.toLowerCase();
  return /^[a-z]$/.test(key) ? key === "k" : event.code === "KeyK";
}
