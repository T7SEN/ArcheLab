import { Schema } from "prosemirror-model";
import type { ChatRegistry } from "@/features/chat/engine";
import { cssOf, lookOf } from "./style-look";
import { styleFromAttrs } from "./style-attrs";

/**
 * The editor's document rules (ADR 0007):
 * - The document holds one line of inline content, as chat does.
 * - `style` is the only mark. Marks of one type exclude each other by default, so a
 *   run holds exactly one style, as the game requires (T25).
 * - Images are inline atoms. They never carry a style (T26); see `normalize` in
 *   `editor-plugins.ts`.
 */
export function createEditorSchema(registry: ChatRegistry) {
  return new Schema({
    nodes: {
      doc: { content: "inline*" },
      text: { group: "inline" },
      image: {
        group: "inline",
        inline: true,
        atom: true,
        selectable: true,
        draggable: false,
        attrs: { id: {} },
        toDOM(node) {
          const id = String(node.attrs.id);
          const label = registry.imagesById.get(id.toLowerCase())?.label ?? id;
          return ["span", { "data-chat-image": id, title: label }, label];
        },
        parseDOM: [
          {
            tag: "span[data-chat-image]",
            getAttrs(dom) {
              const id = dom.getAttribute("data-chat-image") ?? "";
              const image = registry.imagesById.get(id.toLowerCase());
              return image === undefined ? false : { id: image.id };
            },
          },
        ],
      },
    },
    marks: {
      style: {
        attrs: { type: {}, name: {} },
        inclusive: true,
        toDOM(mark) {
          const style = styleFromAttrs(mark.attrs);
          return [
            "span",
            {
              "data-chat-style": `${String(mark.attrs.type)}:${String(mark.attrs.name)}`,
              style: style === null ? "" : cssOf(lookOf(style, registry)),
            },
            0,
          ];
        },
        parseDOM: [
          {
            tag: "span[data-chat-style]",
            getAttrs(dom) {
              const [type, ...rest] = (
                dom.getAttribute("data-chat-style") ?? ""
              ).split(":");
              const name = rest.join(":");
              if (
                type === "tag" &&
                registry.tagsByName.has(name.toLowerCase())
              ) {
                return { type, name };
              }
              if (
                type === "size" &&
                registry.sizesById.has(name.toLowerCase())
              ) {
                return { type, name };
              }
              return false;
            },
          },
        ],
      },
    },
  });
}

export type EditorSchema = ReturnType<typeof createEditorSchema>;
