import { describe, expect, it } from "vitest";
import { classifyCharacter, count, truncateToLimit } from "./count";
import { registry, ruler } from "./test-helpers";

const digits = ruler("123456789");

describe("count", () => {
  it("cuts plain text at 100 characters (T19)", () => {
    const result = count(digits, registry);
    expect(result.used).toBe(120);
    expect(result.overflowAt).toBe(100);
    expect(truncateToLimit(digits, registry).endsWith("123456789J")).toBe(true);
  });

  it("counts color tags toward the limit (T20)", () => {
    const kept = truncateToLimit(`<red>${digits}</>`, registry);
    expect(kept).toBe(`<red>${digits.slice(0, 95)}`);
    expect(kept.endsWith("789I12345")).toBe(true);
  });

  it("counts image tags toward the limit (T21)", () => {
    const markup = '<img id="IconBunny1"/>'.repeat(6);
    expect(truncateToLimit(markup, registry)).toBe(
      `${'<img id="IconBunny1"/>'.repeat(4)}<img id="Ico`,
    );
  });

  it("counts Hangul as one character (T22)", () => {
    const hangul = ruler("가".repeat(9));
    expect(truncateToLimit(hangul, registry).endsWith("가J")).toBe(true);
  });

  it("counts an emoji as two and never splits one (T23)", () => {
    const emoji = ruler("😀".repeat(9));
    expect(count(emoji, registry).overflowAt).toBe(99);
    const kept = truncateToLimit(emoji, registry);
    expect(kept).toHaveLength(99);
    expect(kept.replace(/😀/gu, "")).toBe("ABCDE");
  });

  it("reports refused and untested characters with their positions", () => {
    expect(count("A😀✦★가é", registry).issues).toEqual([
      { index: 1, char: "😀", status: "refused" },
      { index: 3, char: "✦", status: "refused" },
      { index: 6, char: "é", status: "unverified" },
    ]);
  });

  it("classifies characters from the symbols test (T43)", () => {
    for (const ok of "★☆♥♡✓→←↑↓█▓▒░■□●○♪※∞") {
      expect(classifyCharacter(ok, registry)).toBe("ok");
    }
    for (const refused of ["✦", "➤", "⚡", "🙂"]) {
      expect(classifyCharacter(refused, registry)).toBe("refused");
    }
  });

  it("reports nothing to cut when the message fits", () => {
    expect(count("<red>hi</>", registry)).toMatchObject({
      used: 10,
      remaining: 90,
      overflowAt: null,
    });
  });
});
