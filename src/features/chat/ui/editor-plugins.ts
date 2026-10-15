import { baseKeymap } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import {
  Plugin,
  PluginKey,
  type Command,
  type EditorState,
  type Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import {
  classifyCharacter,
  sameStyle,
  type ChatRegistry,
  type Style,
} from "@/features/chat/engine";
import type { EditorSchema } from "./editor-schema";
import { attrsOf, styleFromAttrs } from "./style-attrs";

/** Marks a transaction that came from outside the editor, such as the markup panel. */
export const externalChange = "chatExternalChange";

/**
 * Applies one style to the selected text, replacing any other. With no selection it
 * sets the style for what is typed next. Images are skipped: they never carry a
 * style (T26), and `addMark` alone would style them.
 */
export function applyStyle(schema: EditorSchema, style: Style | null): Command {
  return (state, dispatch) => {
    const type = schema.marks.style;
    const mark = style === null ? null : type.create(attrsOf(style));
    const { from, to, empty } = state.selection;
    if (empty) {
      dispatch?.(state.tr.setStoredMarks(mark === null ? [] : [mark]));
      return true;
    }
    const tr = state.tr.removeMark(from, to, type);
    if (mark !== null) {
      state.doc.nodesBetween(from, to, (node, position) => {
        if (node.isText) {
          tr.addMark(
            Math.max(from, position),
            Math.min(to, position + node.nodeSize),
            mark,
          );
        }
      });
    }
    dispatch?.(tr.scrollIntoView());
    return true;
  };
}

/** Inserts an image at the cursor, replacing any selection. It never inherits a style. */
export function insertImage(schema: EditorSchema, id: string): Command {
  return (state, dispatch) => {
    const node = schema.nodes.image.create({ id });
    dispatch?.(state.tr.replaceSelectionWith(node, false).scrollIntoView());
    return true;
  };
}

/** The style of the selection: one style, none (null), or "mixed". */
export function activeStyle(state: EditorState): Style | null | "mixed" {
  const { from, to, empty, $from } = state.selection;
  if (empty) {
    const mark = (state.storedMarks ?? $from.marks()).find(
      (entry) => entry.type.name === "style",
    );
    return mark === undefined ? null : styleFromAttrs(mark.attrs);
  }
  const styles: (Style | null)[] = [];
  state.doc.nodesBetween(from, to, (node) => {
    if (node.isText) {
      const mark = node.marks.find((entry) => entry.type.name === "style");
      styles.push(mark === undefined ? null : styleFromAttrs(mark.attrs));
    }
  });
  const [first = null] = styles;
  return styles.every((style) => sameStyle(style, first)) ? first : "mixed";
}

/**
 * Keeps the document valid for chat after every change, whatever caused it (typing,
 * paste, drop, IME): removes characters the game refuses (T23, T43) and line breaks,
 * and strips styles from images (T26). `onRefused` hears which characters were removed.
 */
export function normalizePlugin(
  registry: ChatRegistry,
  onRefused: (chars: readonly string[]) => void,
): Plugin {
  return new Plugin({
    appendTransaction(transactions, _old, state) {
      if (!transactions.some((tr) => tr.docChanged)) {
        return null;
      }
      const deletions: { from: number; to: number; char: string }[] = [];
      const styledImages: number[] = [];
      state.doc.descendants((node, position) => {
        if (node.type.name === "image" && node.marks.length > 0) {
          styledImages.push(position);
        }
        if (!node.isText) {
          return;
        }
        let offset = position;
        for (const char of node.text ?? "") {
          if (
            char === "\n" ||
            char === "\r" ||
            classifyCharacter(char, registry) === "refused"
          ) {
            deletions.push({ from: offset, to: offset + char.length, char });
          }
          offset += char.length;
        }
      });
      if (deletions.length === 0 && styledImages.length === 0) {
        return null;
      }
      let tr: Transaction = state.tr;
      for (const position of styledImages) {
        tr = tr.removeMark(position, position + 1);
      }
      // Delete from the end, so earlier positions stay valid.
      for (const { from, to } of [...deletions].reverse()) {
        tr = tr.delete(from, to);
      }
      const refused = deletions
        .map((entry) => entry.char)
        .filter((char) => char !== "\n" && char !== "\r");
      if (refused.length > 0) {
        onRefused(refused);
      }
      return tr;
    },
  });
}

const overflowKey = new PluginKey<DecorationSet>("chatOverflow");

/** Highlights everything from a document position to the end: the part the game will not show as written. */
export function overflowPlugin(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key: overflowKey,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, decorations) {
        const from: unknown = tr.getMeta(overflowKey);
        if (from === undefined) {
          return decorations.map(tr.mapping, tr.doc);
        }
        const end = tr.doc.content.size;
        return typeof from === "number" && from < end
          ? DecorationSet.create(tr.doc, [
              Decoration.inline(from, end, { class: "chat-overflow" }),
            ])
          : DecorationSet.empty;
      },
    },
    props: {
      decorations: (state) => overflowKey.getState(state),
    },
  });
}

/** A transaction that moves the overflow highlight; null removes it. */
export function setOverflow(
  state: EditorState,
  from: number | null,
): Transaction {
  return state.tr.setMeta(overflowKey, from).setMeta("addToHistory", false);
}

/** Undo, redo, the base editing keys, and no line breaks: chat is one line. */
export function editorKeymaps(): Plugin[] {
  const noLineBreak: Command = () => true;
  return [
    history(),
    keymap({
      "Mod-z": undo,
      "Mod-y": redo,
      "Mod-Shift-z": redo,
      Enter: noLineBreak,
      "Shift-Enter": noLineBreak,
      "Mod-Enter": noLineBreak,
    }),
    keymap(baseKeymap),
  ];
}
