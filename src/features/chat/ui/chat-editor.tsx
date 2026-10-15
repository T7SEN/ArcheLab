"use client";

import { Slice, type Node as ProseMirrorNode } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView, type NodeView } from "prosemirror-view";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import {
  optimize,
  parse,
  serialize,
  type Piece,
  type Style,
} from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { portraitOf } from "./chat-icons";
import { chatRegistry } from "./chat-registry";
import {
  docFromPieces,
  fragmentFromPieces,
  piecesFromFragment,
  positionOfGlyph,
} from "./editor-model";
import {
  activeStyle,
  applyStyle,
  editorKeymaps,
  externalChange,
  insertImage,
  normalizePlugin,
  overflowPlugin,
  setOverflow,
} from "./editor-plugins";
import { createEditorSchema } from "./editor-schema";

const schema = createEditorSchema(chatRegistry);

export interface ChatEditorHandle {
  applyStyle: (style: Style | null) => void;
  insertImage: (id: string) => void;
}

interface ChatEditorProps {
  ref?: Ref<ChatEditorHandle>;
  pieces: readonly Piece[];
  /** First glyph the game will not show as written, or null when the message fits. */
  overflowGlyph: number | null;
  portraits: PortraitUrls;
  labelledBy: string;
  describedBy: string;
  onChange: (pieces: Piece[]) => void;
  onRefused: (chars: readonly string[]) => void;
  onActiveStyle: (style: Style | null | "mixed") => void;
}

function placeholderIcon(label: string): HTMLElement {
  const placeholder = document.createElement("span");
  placeholder.className = "chat-icon-placeholder";
  placeholder.textContent = label;
  return placeholder;
}

/** Draws an image as its portrait, or as its labeled placeholder if there is none or it fails to load. */
function imageView(portraits: PortraitUrls) {
  return (node: ProseMirrorNode): NodeView => {
    const id = String(node.attrs.id);
    const image = chatRegistry.imagesById.get(id.toLowerCase());
    const label = image?.label ?? id;
    const dom = document.createElement("span");
    dom.className = "chat-icon";
    dom.contentEditable = "false";
    dom.title = `${label} icon`;
    const src = portraitOf(image, portraits);
    if (src === null) {
      dom.append(placeholderIcon(label));
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${label} icon`;
      img.draggable = false;
      img.addEventListener(
        "error",
        () => {
          dom.replaceChildren(placeholderIcon(label));
        },
        { once: true },
      );
      dom.append(img);
    }
    return { dom, ignoreMutation: () => true };
  };
}

/**
 * The visual editor: one line of chat, edited with ProseMirror (ADR 0007). React owns
 * only the mount point. The engine's pieces are the source of truth: the editor reports
 * every change as pieces, and replaces its content when `pieces` changes from outside.
 */
export function ChatEditor({
  ref,
  pieces,
  overflowGlyph,
  portraits,
  labelledBy,
  describedBy,
  onChange,
  onRefused,
  onActiveStyle,
}: ChatEditorProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onRefused, onActiveStyle });
  const initialPieces = useRef(pieces);

  useEffect(() => {
    callbacks.current = { onChange, onRefused, onActiveStyle };
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (mount === null) {
      return;
    }
    const view: EditorView = new EditorView(mount, {
      state: EditorState.create({
        doc: docFromPieces(schema, initialPieces.current),
        plugins: [
          ...editorKeymaps(),
          normalizePlugin(chatRegistry, (chars) => {
            callbacks.current.onRefused(chars);
          }),
          overflowPlugin(),
        ],
      }),
      attributes: (state) => ({
        role: "textbox",
        "aria-multiline": "false",
        "aria-labelledby": labelledBy,
        "aria-describedby": describedBy,
        spellcheck: "false",
        "data-placeholder": "Type your message",
        "data-empty": String(state.doc.content.size === 0),
      }),
      nodeViews: { image: imageView(portraits) },
      // Copying from the editor gives chat markup; pasting text reads it as markup.
      clipboardTextSerializer: (slice) =>
        optimize(piecesFromFragment(slice.content), chatRegistry),
      clipboardTextParser: (text) =>
        new Slice(
          fragmentFromPieces(
            schema,
            parse(text.replace(/\r\n?|\n/g, " "), chatRegistry),
          ),
          0,
          0,
        ),
      dispatchTransaction(tr) {
        const next = view.state.apply(tr);
        view.updateState(next);
        if (tr.docChanged && tr.getMeta(externalChange) !== true) {
          callbacks.current.onChange(piecesFromFragment(next.doc.content));
        }
        if (tr.docChanged || tr.selectionSet || tr.storedMarksSet) {
          callbacks.current.onActiveStyle(activeStyle(next));
        }
      },
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [labelledBy, describedBy, portraits]);

  // Changes from the markup panel replace the content, unless it already matches.
  useEffect(() => {
    const view = viewRef.current;
    if (
      view === null ||
      serialize(piecesFromFragment(view.state.doc.content)) ===
        serialize(pieces)
    ) {
      return;
    }
    view.dispatch(
      view.state.tr
        .replaceWith(
          0,
          view.state.doc.content.size,
          fragmentFromPieces(schema, pieces),
        )
        .setMeta(externalChange, true),
    );
  }, [pieces]);

  useEffect(() => {
    const view = viewRef.current;
    if (view === null) {
      return;
    }
    const from =
      overflowGlyph === null
        ? null
        : positionOfGlyph(view.state.doc, overflowGlyph);
    view.dispatch(setOverflow(view.state, from));
  }, [overflowGlyph, pieces]);

  useImperativeHandle(
    ref,
    () => ({
      applyStyle: (style) => {
        const view = viewRef.current;
        if (view !== null) {
          applyStyle(schema, style)(view.state, (tr) => {
            view.dispatch(tr);
          });
          view.focus();
        }
      },
      insertImage: (id) => {
        const view = viewRef.current;
        if (view !== null) {
          insertImage(schema, id)(view.state, (tr) => {
            view.dispatch(tr);
          });
          view.focus();
        }
      },
    }),
    [],
  );

  return <div ref={mountRef} className="chat-editor" />;
}
