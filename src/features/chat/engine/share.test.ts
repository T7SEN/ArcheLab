import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare, maxShareCodeLength } from "./share";

describe("share codes", () => {
  it("round-trips chat markup", () => {
    const markup = '<tier4>Transcendent</> drop <img id="RedCash"/> 가 ★';
    const code = encodeShare(markup);
    expect(code).toMatch(/^1[A-Za-z0-9_-]*$/);
    expect(decodeShare(code)).toBe(markup);
  });

  it("round-trips the empty string and unpaired surrogates", () => {
    for (const text of ["", "\uD800", "a\uDC00b", "􏿿", "😀"]) {
      expect(decodeShare(encodeShare(text))).toBe(text);
    }
  });

  it("rejects anything that is not a valid code without throwing", () => {
    const bad: unknown[] = [
      "",
      "2abc",
      "1***",
      "1A",
      "1_w",
      "1wA",
      "1gA",
      `1${"A".repeat(maxShareCodeLength)}`,
      null,
      42,
      { code: "1" },
    ];
    for (const code of bad) {
      expect(decodeShare(code)).toBeNull();
    }
  });

  it("rejects overlong and malformed UTF-8", () => {
    // 0xC0 0x80 is an overlong encoding of U+0000; 0xFF is never valid.
    const overlong = `1${Buffer.from([0xc0, 0x80]).toString("base64url")}`;
    const invalid = `1${Buffer.from([0xff]).toString("base64url")}`;
    expect(decodeShare(overlong)).toBeNull();
    expect(decodeShare(invalid)).toBeNull();
  });
});
