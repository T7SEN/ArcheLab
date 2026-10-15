import type { ImageEntry } from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";

/**
 * The NEXON portrait for an image, or null when it has none: either its art is a
 * labeled placeholder, or the build could not load the portrait (ADR 0008).
 */
export function portraitOf(
  image: ImageEntry | undefined,
  portraits: PortraitUrls,
): string | null {
  if (image?.art.kind !== "descendant") {
    return null;
  }
  return portraits[image.art.descendant] ?? null;
}

/**
 * Icons render much taller than chat text (T8). Their exact height was not
 * measured, so the preview uses this approximation and says so.
 */
export const iconHeightEm = 2;
