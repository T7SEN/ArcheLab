import { chatRegistry } from "./chat-registry";

/**
 * The chat image id that shows each Descendant: the portrait icon for a base
 * Descendant, the Ultimate's character ticket for an Ultimate (ADR 0014). The home
 * page's cards and the command palette both open the builder with it.
 */
export function descendantChatIds(): Map<string, string> {
  const ids = new Map<string, string>();
  for (const image of chatRegistry.data.images) {
    if (image.art.kind === "descendant" || image.art.kind === "ticket") {
      const name = image.art.descendant;
      if (image.art.kind === "descendant" || !ids.has(name)) {
        ids.set(name, image.id);
      }
    }
  }
  return ids;
}
