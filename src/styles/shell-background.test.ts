import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { palette, shellBackground } from "./tokens";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

/** The value of a CSS custom property declared in globals.css. */
function token(name: string): string | undefined {
  const pattern = new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})\\s*;`, "i");
  return pattern.exec(css)?.[1]?.toLowerCase();
}

describe("design tokens mirrored in TypeScript", () => {
  it("matches the --background token for the first paint", () => {
    expect(token("background")).toBe(shellBackground.toLowerCase());
  });

  it("matches every palette token that canvas and WebGL effects use", () => {
    const names: Record<keyof typeof palette, string> = {
      background: "background",
      foreground: "foreground",
      border: "border",
      mutedForeground: "muted-foreground",
      primary: "primary",
      dotGrid: "dot-grid",
    };
    for (const [key, name] of Object.entries(names)) {
      expect(token(name), name).toBe(
        palette[key as keyof typeof palette].toLowerCase(),
      );
    }
  });
});
