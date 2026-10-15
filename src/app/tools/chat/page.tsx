import type { Metadata } from "next";
import { ChatBuilder } from "@/features/chat/ui/chat-builder";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import { fetchPortraitUrls } from "@/lib/nexon/descendants";

export const metadata: Metadata = {
  title: "Chat message builder",
  description:
    "Build colored chat messages for The First Descendant, preview them in game colors, and copy markup that fits the chat limit.",
};

/** The base Descendants whose portraits chat icons show (SKILL.md section 5.1). */
const portraitNames = chatRegistry.data.images.flatMap((image) =>
  image.art.kind === "descendant" ? [image.art.descendant] : [],
);

export default async function ChatBuilderPage() {
  // Fetched once while the page is prerendered (ADR 0008).
  const portraits = await fetchPortraitUrls(portraitNames);
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        Chat message builder
      </h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Build a colored chat message, see how it looks in game, and copy markup
        that fits the {chatRegistry.charLimit}-character chat limit.
      </p>
      <ChatBuilder portraits={portraits} />
    </section>
  );
}
