import { describe, expect, it } from "vitest";
import { optimize } from "./optimize";
import { parse } from "./parse";
import { rendersIdentically } from "./render";
import { serialize } from "./serialize";
import { registry } from "./test-helpers";

function optimizeMarkup(markup: string): string {
  return optimize(parse(markup, registry), registry);
}

describe("serialize", () => {
  it("writes runs, images and escaped text", () => {
    const pieces = parse('a<red>B</><img id="iconbunny1"/>&lt;3', registry);
    expect(serialize(pieces)).toBe('a<red>B</><img id="IconBunny1"/>&lt;3');
  });

  it("escapes every < and any & that would start an escape", () => {
    const pieces = [
      { kind: "text", text: "<red>x</> &lt; & ", style: null },
    ] as const;
    expect(serialize(pieces)).toBe("&lt;red>x&lt;/> &amp;lt; & ");
  });

  it.each([
    ["two pieces", ["&", "lt;"], "&amp;lt;"],
    ["a cut inside the name", ["&am", "p;"], "&amp;amp;"],
    ["a cut before the semicolon", ["&quot", ";"], "&amp;quot;"],
  ])(
    "escapes an escape split across untagged pieces: %s",
    (_label, texts, expected) => {
      const pieces = texts.map((text) => ({
        kind: "text" as const,
        text,
        style: null,
      }));
      expect(serialize(pieces)).toBe(expected);
    },
  );

  it("escapes across an empty run, which it drops", () => {
    const pieces = [
      { kind: "text", text: "&", style: null },
      { kind: "text", text: "", style: { type: "tag", name: "red" } },
      { kind: "text", text: "gt;", style: null },
    ] as const;
    expect(serialize(pieces)).toBe("&amp;gt;");
  });
});

describe("optimize", () => {
  it.each([
    ["the shortest tag of the same color", "<default>A</>", "<Plain>A</>"],
    [
      "merged neighbors with the same color",
      "<red>A</><red>B</>",
      "<red>AB</>",
    ],
    [
      "merged same-color runs across a space",
      "<red>A</> <red>B</>",
      "<red>A B</>",
    ],
    ["an untagged space instead of a colored one", "A<blue> </>B", "A B"],
    [
      "identical colors under one tag",
      "<skillvalue>A</><friendly>B</>",
      "<friendly>AB</>",
    ],
    ["nothing for empty runs", "a<red></>b", "ab"],
    [
      "the short image form",
      '<IMG id="iconbunny1"></>',
      '<img id="IconBunny1"/>',
    ],
    ["unescaped text that cannot form markup", "&lt;3 a &lt; b", "&lt;3 a < b"],
  ])("produces %s", (_label, markup, expected) => {
    expect(optimizeMarkup(markup)).toBe(expected);
  });

  it("keeps a space between bold runs, because a bold space is wider", () => {
    expect(optimizeMarkup("<b>A</> <b>B</>")).toBe("<b>A</> <b>B</>");
  });

  it("keeps markup that the game would show as typed exactly as shown", () => {
    const shown = "<red>A";
    const optimized = optimizeMarkup(shown);
    expect(
      rendersIdentically(
        parse(optimized, registry),
        parse(shown, registry),
        registry,
      ),
    ).toBe(true);
  });

  it("never returns longer markup than serialize", () => {
    const pieces = parse("<QuestEvent>x</> <QuestEvent>y</>", registry);
    expect(optimize(pieces, registry).length).toBeLessThanOrEqual(
      serialize(pieces).length,
    );
  });
});
