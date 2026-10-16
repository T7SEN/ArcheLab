import { ogContentType, ogImage, ogSize } from "@/lib/og-image";
import { siteImage } from "@/lib/site-metadata";

// The site's link preview; pages without their own image use it too (`siteImage`,
// ADR 0020).
export const alt = siteImage.alt;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    title: "Tools for The First Descendant",
    subtitle: "Free and fan-made, built on NEXON's game data.",
  });
}
