import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { count } from "./count";
import { optimize } from "./optimize";
import { parse } from "./parse";
import type { Piece, Style } from "./pieces";
import { rendersIdentically } from "./render";
import { serialize } from "./serialize";
import { decodeShare, encodeShare } from "./share";
import { registry } from "./test-helpers";

const runs = { numRuns: 1000 } as const;

/** Fragments that stress the parser: markup pieces, escapes, names, whitespace, Hangul. */
const fragments = [
  "<",
  ">",
  "/",
  "/>",
  "</>",
  "&",
  ";",
  "&lt;",
  "&gt;",
  "&amp;",
  "&quot;",
  '"',
  "=",
  " ",
  "  ",
  "\t",
  "A",
  "b",
  "3",
  "가",
  "★",
  "é",
  "<red>",
  "<RED>",
  "<zzz>",
  "<b>",
  "<default>",
  "<Plain>",
  "<img",
  ' id="IconBunny1"',
  '<img id="IconBunny1"/>',
  '<img id="nope"/>',
  '<a id="ChatSender_Big">',
  "<tier 2>",
  "red",
  "lt",
  "amp",
] as const;

/** Chat is a single line: generated text never contains a line break. */
const noLineBreak = (text: string): boolean => !text.includes("\n");

const textArbitrary = fc
  .array(
    fc.oneof(
      { weight: 3, arbitrary: fc.constantFrom(...fragments) },
      {
        weight: 1,
        arbitrary: fc
          .string({ unit: "binary", maxLength: 3 })
          .filter(noLineBreak),
      },
    ),
    { maxLength: 8 },
  )
  .map((parts) => parts.join(""));

const styleArbitrary: fc.Arbitrary<Style | null> = fc.oneof(
  fc.constant(null),
  fc.constantFrom(
    ...registry.data.tags.map((tag): Style => ({
      type: "tag",
      name: tag.name,
    })),
  ),
  fc.constantFrom(
    ...registry.data.sizes.map((size): Style => ({
      type: "size",
      id: size.id,
    })),
  ),
);

const pieceArbitrary: fc.Arbitrary<Piece> = fc.oneof(
  {
    weight: 4,
    arbitrary: fc.record({
      kind: fc.constant("text" as const),
      text: textArbitrary,
      style: styleArbitrary,
    }),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      kind: fc.constant("image" as const),
      id: fc.constantFrom(...registry.data.images.map((image) => image.id)),
    }),
  },
);

const piecesArbitrary = fc.array(pieceArbitrary, { maxLength: 8 });

/** Random markup, read the way the game reads it: the most realistic input. */
const parsedMarkupArbitrary = textArbitrary.map((markup) =>
  parse(markup, registry),
);

const inputs = fc.oneof(piecesArbitrary, parsedMarkupArbitrary);

describe("engine invariants (SKILL.md section 5.2)", () => {
  it("1. parse(serialize(pieces)) renders identically to pieces", () => {
    fc.assert(
      fc.property(inputs, (pieces) =>
        rendersIdentically(
          parse(serialize(pieces), registry),
          pieces,
          registry,
        ),
      ),
      runs,
    );
  });

  it("2. optimize output renders identically to its input", () => {
    fc.assert(
      fc.property(inputs, (pieces) =>
        rendersIdentically(
          parse(optimize(pieces, registry), registry),
          pieces,
          registry,
        ),
      ),
      runs,
    );
  });

  it("3. optimize never produces longer markup than serialize", () => {
    fc.assert(
      fc.property(
        inputs,
        (pieces) =>
          optimize(pieces, registry).length <= serialize(pieces).length,
      ),
      runs,
    );
  });

  it("4. optimize is idempotent", () => {
    fc.assert(
      fc.property(inputs, (pieces) => {
        const once = optimize(pieces, registry);
        expect(optimize(parse(once, registry), registry)).toBe(once);
      }),
      runs,
    );
  });

  it("5. decodeShare(encodeShare(m)) === m for any string", () => {
    const codeUnits = fc
      .array(fc.integer({ min: 0, max: 0xffff }), { maxLength: 64 })
      .map((units) => String.fromCharCode(...units));
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ unit: "binary", maxLength: 200 }),
          codeUnits,
          textArbitrary,
        ),
        (markup) => decodeShare(encodeShare(markup)) === markup,
      ),
      runs,
    );
  });

  it("5. decodeShare never throws on arbitrary input", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string({ unit: "binary" }), fc.anything()),
        (input) => {
          expect(() => decodeShare(input)).not.toThrow();
        },
      ),
      runs,
    );
  });

  it("parse and count never throw on arbitrary text", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string({ unit: "binary" }), textArbitrary),
        (markup) => {
          expect(() => parse(markup, registry)).not.toThrow();
          expect(() => count(markup, registry)).not.toThrow();
        },
      ),
      runs,
    );
  });
});
