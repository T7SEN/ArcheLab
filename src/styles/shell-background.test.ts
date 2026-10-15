import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shellBackground } from "./tokens";

const shellTokenPattern = /--color-shell:\s*(#[0-9a-f]{3,8})\s*;/i;

describe("shell background", () => {
  it("matches the --color-shell design token", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
    const token = shellTokenPattern.exec(css)?.[1];

    expect(token?.toLowerCase()).toBe(shellBackground.toLowerCase());
  });
});
