import { BadgeCheck, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { ChatBuilder } from "@/features/chat/ui/chat-builder";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import { fetchPortraitUrls } from "@/lib/nexon/descendants";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = {
  title: "Chat message builder",
  description:
    "Build colored chat messages for The First Descendant, preview them in game colors, and copy markup that fits the chat limit.",
};

/** The Descendants whose portraits chat icons and tickets show (SKILL.md section 5.1). */
const portraitNames = [
  ...new Set(
    chatRegistry.data.images.flatMap((image) =>
      image.art.kind === "descendant" || image.art.kind === "ticket"
        ? [image.art.descendant]
        : [],
    ),
  ),
];

const { status, verifiedOn } = chatRegistry.data;

const verifiedDate =
  verifiedOn === null
    ? null
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(verifiedOn));

export default async function ChatBuilderPage() {
  // Fetched once while the page is prerendered (ADR 0008).
  const portraits = await fetchPortraitUrls(portraitNames);
  return (
    <>
      {/* The hero slides up under the floating navbar, as on the home page. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)] lg:pb-12">
          {status === "verified" && verifiedDate !== null ? (
            <Badge variant="secondary">
              <BadgeCheck aria-hidden="true" className="text-primary" />
              Verified in game, {verifiedDate}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <TriangleAlert aria-hidden="true" />
              Provisional: not verified in game yet
            </Badge>
          )}
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Chat message builder
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Build a colored chat message, see how it looks in game, and copy
            markup that fits the {chatRegistry.charLimit}-character chat limit.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <ChatBuilder portraits={portraits} />
      </section>
    </>
  );
}
