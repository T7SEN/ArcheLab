import { EditorState, TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";
import { parse, serialize } from "@/features/chat/engine";
import { chatRegistry } from "./chat-registry";
import { docFromPieces, piecesFromFragment } from "./editor-model";
import {
  activeStyle,
  applyStyle,
  insertImage,
  normalizePlugin,
} from "./editor-plugins";
import { createEditorSchema } from "./editor-schema";

const schema = createEditorSchema(chatRegistry);

function stateOf(markup: string, refused: string[] = []): EditorState {
  return EditorState.create({
    doc: docFromPieces(schema, parse(markup, chatRegistry)),
    plugins: [normalizePlugin(chatRegistry, (chars) => refused.push(...chars))],
  });
}

function select(state: EditorState, from: number, to: number): EditorState {
  return state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, from, to)),
  );
}

function run(
  state: EditorState,
  command: ReturnType<typeof applyStyle>,
): EditorState {
  let next = state;
  command(state, (tr) => {
    next = state.apply(tr);
  });
  return next;
}

function markupOf(state: EditorState): string {
  return serialize(piecesFromFragment(state.doc.content));
}

describe("editor commands", () => {
  it("replaces the style of the selected text", () => {
    const state = select(stateOf("<red>Hello</>"), 0, 2);
    const next = run(state, applyStyle(schema, { type: "tag", name: "blue" }));
    expect(markupOf(next)).toBe("<blue>He</><red>llo</>");
  });

  it("clears a style", () => {
    const state = select(stateOf("<red>Hi</>"), 0, 2);
    expect(markupOf(run(state, applyStyle(schema, null)))).toBe("Hi");
  });

  it("never styles an image inside the selection", () => {
    const state = select(stateOf('a<img id="cash"/>b'), 0, 3);
    const next = run(state, applyStyle(schema, { type: "tag", name: "red" }));
    expect(next.doc.child(1).marks).toEqual([]);
    expect(markupOf(next)).toBe('<red>a</><img id="cash"/><red>b</>');
  });

  it("styles what is typed next when nothing is selected", () => {
    const state = run(
      select(stateOf("a"), 1, 1),
      applyStyle(schema, { type: "tag", name: "tier4" }),
    );
    const typed = state.apply(state.tr.insertText("B"));
    expect(markupOf(typed)).toBe("a<tier4>B</>");
  });

  it("inserts an image without a style, splitting a run", () => {
    const state = select(stateOf("<red>ab</>"), 1, 1);
    const next = run(state, insertImage(schema, "RedCash"));
    expect(markupOf(next)).toBe('<red>a</><img id="RedCash"/><red>b</>');
  });

  it("reports the selection's style", () => {
    const state = stateOf("<red>ab</><blue>c</>");
    expect(activeStyle(select(state, 0, 2))).toEqual({
      type: "tag",
      name: "red",
    });
    expect(activeStyle(select(state, 1, 3))).toBe("mixed");
    expect(activeStyle(select(stateOf("plain"), 0, 3))).toBeNull();
  });
});

describe("normalize plugin", () => {
  it("removes refused characters and line breaks, and reports them", () => {
    const refused: string[] = [];
    const state = stateOf("", refused);
    const next = state.apply(state.tr.insertText("a🙂b\n✦c"));
    expect(markupOf(next)).toBe("abc");
    expect(refused).toEqual(["🙂", "✦"]);
  });

  it("keeps verified and untested characters", () => {
    const state = stateOf("");
    const next = state.apply(state.tr.insertText("가★é"));
    expect(markupOf(next)).toBe("가★é");
  });

  it("strips a style from an image", () => {
    const state = stateOf('<img id="cash"/>');
    const red = schema.marks.style.create({ type: "tag", name: "red" });
    const next = state.apply(state.tr.addMark(0, 1, red));
    expect(next.doc.child(0).marks).toEqual([]);
  });
});
