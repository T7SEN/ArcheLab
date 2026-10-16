import { chatRegistry } from "@/features/chat/ui/chat-registry";

/**
 * Each attribute's icon from NEXON's own Library (ADR 0012), as the chat registry links
 * it: the registry's `nexon-site` art whose label is the attribute's name, such as
 * "Fire" for `Blazer` or "Non-Attribute" for `Plain`. Read on the server, so a page
 * hands its client components plain URLs instead of the whole registry.
 */
export function elementIconUrls(
  elements: readonly string[],
): Readonly<Record<string, string>> {
  const urls = new Map(
    chatRegistry.data.images.flatMap((image) =>
      image.art.kind === "nexon-site"
        ? [[image.label, image.art.url] as const]
        : [],
    ),
  );
  return Object.fromEntries(
    elements.flatMap((element) => {
      const url = urls.get(element);
      return url === undefined ? [] : [[element, url]];
    }),
  );
}
