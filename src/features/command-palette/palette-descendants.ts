import { descendantChatIds } from "@/features/chat/ui/descendant-icons";
import { shareHash } from "@/features/chat/ui/share-link";
import type { PaletteDescendant } from "./site-commands";

/**
 * The Descendants the palette offers, as plain data for the server layout to hand the
 * client provider, so pages without the builder never load the chat registry: each
 * one with a chat icon, linking to the builder with that icon (ADR 0015, ADR 0022).
 */
export function paletteDescendants(): PaletteDescendant[] {
  return [...descendantChatIds()]
    .flatMap(([name, id]) => {
      const hash = shareHash(`<img id="${id}"/>`, "normal");
      return hash === null
        ? []
        : [
            {
              name,
              href: `/tools/chat${hash}`,
              ultimate: name.startsWith("Ultimate "),
            },
          ];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
