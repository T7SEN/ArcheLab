import type { ImageEntry } from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";

/**
 * The art URL for an image, or null when it has none: a Descendant's API portrait,
 * for a portrait icon or a character ticket (null if the build could not load it,
 * ADR 0008), an image on NEXON's own site
 * (ADR 0012), or nothing for a labeled placeholder.
 */
export function artUrlOf(
  image: ImageEntry | undefined,
  portraits: PortraitUrls,
): string | null {
  switch (image?.art.kind) {
    case "descendant":
    case "ticket":
      return portraits[image.art.descendant] ?? null;
    case "nexon-site":
      return image.art.url;
    default:
      return null;
  }
}

/**
 * A chat icon's height in cap heights of the text beside it: T7SEN's screenshot of
 * test sheet P15 (2026-10-15) shows 26px icons beside 12px capitals, ending 3.5px
 * below the baseline. The preview's `.chat-icon` rules in globals.css match both.
 */
export const iconHeightCaps = 26 / 12;

/**
 * Descendant portraits are round and larger: test sheet Q1 (2026-10-15) shows a 46px
 * circle beside 12px capitals, ending 5px below the baseline (`.chat-icon-portrait`).
 */
export const portraitHeightCaps = 46 / 12;

/**
 * The classes that size an icon with art in a chat line. Character tickets are the
 * same size as portraits, with a gold ring (test sheet Q5 to Q7).
 */
export function chatIconClass(image: ImageEntry | undefined): string {
  switch (image?.art.kind) {
    case "descendant":
      return "chat-icon chat-icon-portrait";
    case "ticket":
      return "chat-icon chat-icon-portrait chat-icon-ticket";
    default:
      return "chat-icon";
  }
}
