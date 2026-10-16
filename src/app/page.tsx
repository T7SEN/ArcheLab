import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GameShowcase } from "@/components/game-showcase";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { StarBorder } from "@/components/react-bits/star-border";
import { ComingSoonTools, FeaturedTool } from "@/components/tool-cards";
import { Badge } from "@/components/ui/badge";
import { tools } from "@/data/tools";
import { ChatShowcase } from "@/features/chat/ui/chat-showcase";
import { fetchShowcase } from "@/lib/nexon/showcase";
import { pageMetadata, siteDescription } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/",
  description: siteDescription,
  ownImage: true,
});

const liveTools = tools.flatMap((tool) =>
  tool.status === "live" ? [tool] : [],
);
const comingSoon = tools.flatMap((tool) =>
  tool.status === "coming-soon" ? [tool] : [],
);

export default async function HomePage() {
  // Fetched once while the page is prerendered (ADR 0008, ADR 0018). The Descendant
  // portraits also serve the chat builder's sample window.
  const showcase = await fetchShowcase();
  const portraits = Object.fromEntries(
    showcase.descendants.items.map((item) => [item.name, item.imageUrl]),
  );
  // A live sample for each tool that has one, by slug.
  const samples: Record<string, ReactNode> = {
    chat: <ChatShowcase portraits={portraits} />,
  };
  return (
    <>
      {/* A short, centered hero (ADR 0018). It slides up under the floating navbar, so
          its background reaches the top of the page; its padding adds the header's
          height back. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-[calc(var(--site-header-height)+5rem)] pb-20 text-center lg:pt-[calc(var(--site-header-height)+7rem)] lg:pb-28">
          <Badge variant="secondary">
            <Sparkles aria-hidden="true" />
            Free and unofficial
          </Badge>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] font-bold tracking-wide sm:text-6xl lg:text-7xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Tools for The First Descendant
            </ShinyText>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Fan-made tools for Descendants, built on NEXON&apos;s game data.
            Start with the chat message builder; Descendant and weapon builds
            are next.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <StarBorder
              href="/tools/chat"
              radius={10}
              thickness={1.5}
              glow={0.9}
              backgroundColor="color-mix(in srgb, var(--primary) 22%, var(--card))"
              className="px-5 py-3 text-sm font-semibold"
            >
              Open the chat builder
              <ArrowRight aria-hidden="true" className="size-4" />
            </StarBorder>
            {comingSoon.length > 0 ? (
              <a
                href="#coming-soon"
                className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card/60 px-5 py-3 text-sm font-semibold backdrop-blur-md transition-colors outline-none hover:border-ring/60 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                What&apos;s coming
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="pt-4 pb-12">
        {liveTools.map((tool) => (
          <FeaturedTool
            key={tool.slug}
            tool={tool}
            sample={samples[tool.slug]}
          />
        ))}
        <ComingSoonTools tools={comingSoon} />
        <GameShowcase
          descendants={showcase.descendants}
          weapons={showcase.weapons}
        />
      </div>
    </>
  );
}
