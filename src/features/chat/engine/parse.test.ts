import { describe, expect, it } from "vitest";
import { parse } from "./parse";
import { registry, show } from "./test-helpers";

/** Markup and what the game showed, from reports/TFD in-game chat tests.md. */
const inGame: readonly (readonly [
  id: string,
  markup: string,
  shown: string,
])[] = [
  ["T1", "<red>A</>", "[red:A]"],
  ["T2", "<red>A</red>", "<red>A</red>"],
  ["T3", "<red>A</red>B</>", "[red:A</red>B]"],
  ["T4", "<red>A", "<red>A"],
  ["T5", "A</>", "A</>"],
  ["S1", "<red>A</>B", "[red:A]B"],
  ["T24", "<red>A</><blue>B</>", "[red:A][blue:B]"],
  ["T25", "<red>A<blue>B</>C</>", "[red:A<blue>B]C</>"],
  ["T12", "<RED>A</><Red>B</><red>C</>", "[red:ABC]"],
  ["T16", "<zzz>A</>", "<zzz>A</>"],
  ["S2", "<red> A</>", "[red: A]"],
  [
    "T27",
    "<red >A</> < red>B</> <tier 2>C</>",
    "<red >A</> < red>B</> <tier 2>C</>",
  ],
  ["T28", "&lt;red&gt;A&lt;/&gt;", "<red>A</>"],
  ["T6", '<img id="IconBunny1"/>', "{IconBunny1}"],
  ["T7", '<img id="IconBunny1"></>', "{IconBunny1}"],
  ["T8", 'a<img id="IconBunny1"/>b', "a{IconBunny1}b"],
  ["T9", '<img id="IconBunny1" />', '<img id="IconBunny1" />'],
  ["T10", "<img id=IconBunny1/>", "<img id=IconBunny1/>"],
  ["T11", '<img id="BossIcon"/>', "{BossIcon}"],
  ["T13", '<img id="iconbunny1"/>', "{IconBunny1}"],
  ["T14", '<IMG id="IconBunny1"/>', "{IconBunny1}"],
  ["T15", '<img ID="IconBunny1"/>', "{IconBunny1}"],
  ["T17", '<img id="NotARealIcon"/>', '<img id="NotARealIcon"/>'],
  ["T26", '<red>A<img id="IconBunny1"/>B</>', '[red:A<img id="IconBunny1"/>B]'],
  [
    "T39",
    '<img id="cash"/><img id="BlueCash"/><img id="RedCash"/>',
    "{cash}{BlueCash}{RedCash}",
  ],
  [
    "T40",
    '<img id="Icon_CharacterTicket_004_U01"/>',
    "{Icon_CharacterTicket_004_U01}",
  ],
  [
    "T41",
    '<img id="icon_chatacterticket_004_u01"/>',
    '<img id="icon_chatacterticket_004_u01"/>',
  ],
  ["T42", '<img id="IconBunny1" height="40"/>', "{IconBunny1}"],
  [
    "T18",
    "<cyan>A</><pink>B</><whisper>C</>",
    "<cyan>A</><pink>B</><whisper>C</>",
  ],
  [
    "T29",
    "<skillvalue>A</><queststory>B</><purple>C</>",
    "[skillvalue:A][queststory:B][purple:C]",
  ],
  [
    "T30",
    "<Highlight>A</><Gray50>B</><Camp>C</><Archive>D</>",
    "[Highlight:A][Gray50:B][Camp:C][Archive:D]",
  ],
  ["T32", "<b>bold</> <i>italic</>", "[b:bold] [i:italic]"],
  ["T33", '<a id="ChatSender_Big">Big</>', "[a#ChatSender_Big:Big]"],
  [
    "X9",
    '<a id="ChatSender_Big">L</> <a id="ChatSender_VeryBig">XL</> <a id="Test_Link">Link</>',
    "[a#ChatSender_Big:L] [a#ChatSender_VeryBig:XL] [a#Test_Link:Link]",
  ],
];

describe("parse", () => {
  it.each(inGame)("%s: %s", (_id, markup, shown) => {
    expect(show(parse(markup, registry))).toBe(shown);
  });

  it("shows the whole message raw when the limit cuts off the closer (T20)", () => {
    const cut = `<red>${"123456789A".repeat(9)}12345`;
    expect(show(parse(cut, registry))).toBe(cut);
  });

  it("keeps complete images when the limit cuts the next one (T21)", () => {
    const cut = `${'<img id="IconBunny1"/>'.repeat(4)}<img id="Ico`;
    expect(show(parse(cut, registry))).toBe(
      `${"{IconBunny1}".repeat(4)}<img id="Ico`,
    );
  });

  it("lets an unknown tag swallow tags inside it, as Unreal's parser does (inferred)", () => {
    expect(show(parse("<zzz>a<red>b</>", registry))).toBe("<zzz>a<red>b</>");
  });

  it("treats a self-closing or empty color tag as rendering nothing (inferred)", () => {
    expect(show(parse("a<red/>b<red></>c", registry))).toBe("abc");
  });

  it("decodes all four escapes in one left-to-right pass", () => {
    expect(show(parse("&quot;&amp;lt;&gt;", registry))).toBe('"&lt;>');
  });

  it("never matches a tag across a line break", () => {
    expect(show(parse("<red>a\nb</>", registry))).toBe("<red>a\nb</>");
  });
});
