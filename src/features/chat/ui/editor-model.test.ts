import fc from "fast-check";
import { EditorState, TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";
import {
  parse,
  render,
  rendersIdentically,
  serialize,
} from "@/features/chat/engine";
import { chatRegistry } from "./chat-registry";
import {
  commonGlyphPrefix,
  docFromPieces,
  piecesFromFragment,
  positionOfGlyph,
} from "./editor-model";
import { createEditorSchema } from "./editor-schema";
import { attrsOf } from "./style-attrs";

const schema = createEditorSchema(chatRegistry);
const red = schema.marks.style.create(attrsOf({ type: "tag", name: "red" }));
const blue = schema.marks.style.create(attrsOf({ type: "tag", name: "blue" }));

function piecesOf(markup: string) {
  return parse(markup, chatRegistry);
}

describe("editor document model", () => {
  it("holds one line of inline content", () => {
    const doc = docFromPieces(schema, piecesOf('a<red>B</><img id="cash"/>'));
    expect(() => {
      doc.check();
    }).not.toThrow();
    expect(doc.isTextblock).toBe(true);
    expect(doc.childCount).toBe(3);
  });

  it("round-trips pieces", () => {
    for (const markup of [
      "",
      "plain",
      '<tier4>Transcendent</> drop <img id="RedCash"/>',
      '<a id="ChatSender_Big">Big</><b>bold</><i>it</>',
      "&lt;red&gt; stays literal",
    ]) {
      const pieces = piecesOf(markup);
      const back = piecesFromFragment(docFromPieces(schema, pieces).content);
      expect(serialize(back)).toBe(serialize(pieces));
    }
  });

  it("round-trips any parsed message", () => {
    const alphabet = fc.constantFrom(
      "a",
      " ",
      "<",
      "&",
      "<red>",
      "<b>",
      '<a id="ChatSender_Small">',
      "</>",
      '<img id="cash"/>',
      "가",
    );
    fc.assert(
      fc.property(fc.array(alphabet, { maxLength: 20 }), (parts) => {
        const pieces = piecesOf(parts.join(""));
        const back = piecesFromFragment(docFromPieces(schema, pieces).content);
        return rendersIdentically(back, pieces, chatRegistry);
      }),
      { numRuns: 300 },
    );
  });

  it("lets one style replace another, never stacking them", () => {
    const doc = docFromPieces(schema, piecesOf("<red>Hi</>"));
    let state = EditorState.create({ doc });
    state = state.apply(state.tr.addMark(0, 2, blue));
    expect(state.doc.child(0).marks).toEqual([blue]);
  });

  it("lets addMark style an image, which the editor must undo", () => {
    const doc = docFromPieces(schema, piecesOf('a<img id="cash"/>b'));
    const state = EditorState.create({ doc });
    const styled = state.apply(state.tr.addMark(0, doc.content.size, red));
    expect(styled.doc.child(1).marks).toEqual([red]);
    // The engine model still reads it as an unstyled image.
    expect(piecesFromFragment(styled.doc.content)).toEqual([
      { kind: "text", text: "a", style: { type: "tag", name: "red" } },
      { kind: "image", id: "cash" },
      { kind: "text", text: "b", style: { type: "tag", name: "red" } },
    ]);
  });

  it("finds document positions for glyphs, counting UTF-16 units", () => {
    // "😀" is one glyph but two UTF-16 units; the image is one position.
    const doc = schema.nodes.doc.create(null, [
      schema.text("a😀"),
      schema.nodes.image.create({ id: "cash" }),
      schema.text("b"),
    ]);
    expect([0, 1, 2, 3, 4].map((glyph) => positionOfGlyph(doc, glyph))).toEqual(
      [0, 1, 3, 4, 5],
    );
    const state = EditorState.create({ doc });
    expect(() =>
      TextSelection.create(state.doc, positionOfGlyph(doc, 3)),
    ).not.toThrow();
  });

  it("measures where two renderings start to differ", () => {
    const full = render(piecesOf("<red>abc</>"), chatRegistry);
    const cut = render(piecesOf("<red>abc</"), chatRegistry);
    expect(commonGlyphPrefix(full, full)).toBe(full.length);
    expect(commonGlyphPrefix(full, cut)).toBe(0);
  });
});
