import { describe, expect, it } from "vitest";
import { isPaletteShortcut, type ShortcutEvent } from "./shortcut";

const press = (overrides: Partial<ShortcutEvent>): ShortcutEvent => ({
  key: "k",
  code: "KeyK",
  ctrlKey: true,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  isComposing: false,
  ...overrides,
});

describe("isPaletteShortcut", () => {
  it("takes Ctrl+K and ⌘K", () => {
    expect(isPaletteShortcut(press({}))).toBe(true);
    expect(isPaletteShortcut(press({ ctrlKey: false, metaKey: true }))).toBe(
      true,
    );
    expect(isPaletteShortcut(press({ key: "K" }))).toBe(true);
  });

  it("ignores K alone, Shift or Alt with it, and input-method composition", () => {
    expect(isPaletteShortcut(press({ ctrlKey: false }))).toBe(false);
    expect(isPaletteShortcut(press({ shiftKey: true, key: "K" }))).toBe(false);
    expect(isPaletteShortcut(press({ altKey: true }))).toBe(false);
    expect(isPaletteShortcut(press({ isComposing: true }))).toBe(false);
    expect(isPaletteShortcut(press({ key: "j", code: "KeyJ" }))).toBe(false);
  });

  it("follows the letter in Latin layouts, wherever the key sits", () => {
    // Dvorak: the letter K is where QWERTY has V, and QWERTY's K types T.
    expect(isPaletteShortcut(press({ key: "k", code: "KeyV" }))).toBe(true);
    expect(isPaletteShortcut(press({ key: "t", code: "KeyK" }))).toBe(false);
  });

  it("follows the key's position in other layouts", () => {
    // Arabic: the K key types ن; Russian: it types л.
    expect(isPaletteShortcut(press({ key: "ن", code: "KeyK" }))).toBe(true);
    expect(isPaletteShortcut(press({ key: "л", code: "KeyK" }))).toBe(true);
    expect(isPaletteShortcut(press({ key: "ل", code: "KeyG" }))).toBe(false);
  });
});
