import { ogContentType, ogImage, ogSize } from "@/lib/og-image";

// The builder's link preview: share links (`/tools/chat#m=…`) show it too, since the
// message lives in the hash, which never reaches the server (ADR 0015, ADR 0020).
export const alt = "ArcheLab's chat message builder for The First Descendant";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    title: "Chat message builder",
    subtitle: "Colored chat messages, previewed in game colors.",
  });
}
