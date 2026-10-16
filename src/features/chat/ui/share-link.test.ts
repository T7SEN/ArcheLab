import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { encodeShare, maxShareCodeLength } from "@/features/chat/engine";
import { readShareHash, shareHash } from "./share-link";

const channels = ["normal", "world", "trade", "whisper", "party"] as const;

describe("share links", () => {
  it("round-trips any message with its channel", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, unit: "binary" }),
        fc.constantFrom(...channels),
        (markup, channel) => {
          const hash = shareHash(markup, channel);
          expect(hash).not.toBeNull();
          expect(readShareHash(hash ?? "", channels)).toEqual({
            kind: "message",
            markup,
            channel,
          });
        },
      ),
      { numRuns: 300 },
    );
  });

  it("writes the code and the channel into the hash", () => {
    expect(shareHash("<red>Hi</>", "party")).toBe(
      `#m=${encodeShare("<red>Hi</>")}&c=party`,
    );
  });

  it("keeps the current channel when the link names an unknown one", () => {
    const code = encodeShare("Hi");
    expect(readShareHash(`#m=${code}&c=guild`, channels)).toEqual({
      kind: "message",
      markup: "Hi",
      channel: null,
    });
    expect(readShareHash(`#m=${code}`, channels)).toEqual({
      kind: "message",
      markup: "Hi",
      channel: null,
    });
  });

  it("finds no message without a code, or with an empty one", () => {
    expect(readShareHash("", channels)).toEqual({ kind: "none" });
    expect(readShareHash("#section", channels)).toEqual({ kind: "none" });
    expect(readShareHash("#c=party", channels)).toEqual({ kind: "none" });
    expect(readShareHash(`#m=${encodeShare("")}`, channels)).toEqual({
      kind: "none",
    });
  });

  it("calls a code that does not decode broken", () => {
    for (const code of ["", "2SGk", "1%%%", "1SGk=", "1S", "1+/"]) {
      expect(readShareHash(`#m=${code}`, channels), code).toEqual({
        kind: "broken",
      });
    }
  });

  it("refuses to link a message whose code would be too long to open", () => {
    expect(shareHash("x".repeat(maxShareCodeLength), "normal")).toBeNull();
  });
});
