/**
 * Design tokens for code that cannot read CSS variables: the inline first-paint
 * background on <html>, and canvas or WebGL effects. The same values as the tokens in
 * globals.css; shell-background.test.ts keeps them equal.
 */
export const palette = {
  background: "#0a0812",
  foreground: "#ece7f7",
  border: "#2b2244",
  mutedForeground: "#a69dc3",
  primary: "#a184ff",
} as const;

/** Page background, inlined on <html> so the first paint is dark before any stylesheet loads. */
export const shellBackground = palette.background;
