import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { palette } from "@/styles/tokens";
import { logoPath, logoStrokeWidth } from "./logo-mark";

const favicon = readFileSync(
  new URL("../app/icon.svg", import.meta.url),
  "utf8",
);

describe("the favicon", () => {
  it("draws the same mark as the navbar and footer", () => {
    expect(favicon).toContain(`d="${logoPath}"`);
    expect(favicon).toContain(`stroke-width="${String(logoStrokeWidth)}"`);
  });

  it("uses the design tokens: the mark in primary on the background", () => {
    expect(favicon).toContain(`fill="${palette.background}"`);
    expect(favicon).toContain(`stroke="${palette.primary}"`);
  });
});

describe("favicon.ico", () => {
  // Drawn from icon.svg by `pnpm favicon` (scripts/make-favicon.mjs).
  const ico = readFileSync(new URL("../app/favicon.ico", import.meta.url));

  it("holds 16, 32 and 48px PNG frames", () => {
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const frames = Array.from({ length: count }, (_, index) => {
      const entry = 6 + 16 * index;
      const offset = ico.readUInt32LE(entry + 12);
      return {
        size: ico.readUInt8(entry),
        png: ico.subarray(offset, offset + 8).toString("hex"),
      };
    });
    expect(frames).toEqual(
      [16, 32, 48].map((size) => ({ size, png: "89504e470d0a1a0a" })),
    );
  });
});
