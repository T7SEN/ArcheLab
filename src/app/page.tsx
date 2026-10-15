import { cn } from "cn";
import {
  ArrowRight,
  Check,
  FlaskConical,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { PixelCard } from "@/components/react-bits/pixel-card";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { SpecularButton } from "@/components/react-bits/specular-button";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { StarBorder } from "@/components/react-bits/star-border";
import { Badge } from "@/components/ui/badge";
import { ChatShowcase } from "@/features/chat/ui/chat-showcase";
import { fetchPortraitUrls } from "@/lib/nexon/descendants";
import { palette } from "@/styles/tokens";

const builderFeatures = [
  "Every verified color, rarity color and text size",
  "Icons, with NEXON portraits for Descendants",
  "Counts the way the game does, against the chat limit",
];

/** Widths of the coming-soon card's placeholder feature lines. */
const placeholderRows = ["w-4/5", "w-3/5", "w-2/3"];

export default async function HomePage() {
  // Fetched once while the page is prerendered (ADR 0008).
  const portraits = await fetchPortraitUrls(["Bunny"]);
  return (
    <>
      {/* The hero slides up under the floating navbar, so its background reaches the
          top of the page; its padding adds the header's height back. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pt-[calc(var(--site-header-height)+4rem)] pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:pt-[calc(var(--site-header-height)+6rem)] lg:pb-24">
          <div>
            <Badge variant="secondary">
              <Sparkles aria-hidden="true" />
              Free and unofficial
            </Badge>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] font-bold tracking-wide sm:text-6xl">
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
              Fan-made tools for Descendants. Start with the chat message
              builder: color your messages, see them in game colors, and paste
              markup that fits the chat limit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
            </div>
          </div>
          <ChatShowcase portraits={portraits} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold tracking-wide">
          Tools
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <SpotlightCard className="flex h-full flex-col gap-4 p-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <MessageSquareText aria-hidden="true" className="size-5" />
              </div>
              <div className="grid gap-1">
                <h3 className="font-display text-xl font-semibold tracking-wide">
                  Chat message builder
                </h3>
                <p className="text-sm text-muted-foreground">
                  Color your chat messages and copy markup that pastes right
                  into the game.
                </p>
              </div>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {builderFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <SpecularButton
                href="/tools/chat"
                size="sm"
                radius={10}
                className="mt-auto w-fit"
              >
                Open the builder
                <ArrowRight aria-hidden="true" className="size-4" />
              </SpecularButton>
            </SpotlightCard>
          </li>
          <li>
            {/* A tool card still being drawn: its lines are placeholders. */}
            <PixelCard
              noFocus
              radius={14}
              origin="pointer"
              gap={6}
              opacity={0.7}
              fade={0.85}
              className="h-full"
            >
              <div className="flex h-full w-full flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground outline-1 -outline-offset-1 outline-muted-foreground/40 outline-dashed">
                    <FlaskConical aria-hidden="true" className="size-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-card text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
                    />
                    Coming soon
                  </Badge>
                </div>
                <div className="grid gap-1">
                  <h3 className="font-display text-xl font-semibold tracking-wide">
                    More tools are on the way
                  </h3>
                  <div aria-hidden="true" className="grid gap-3 py-1.5">
                    <div className="h-2 w-full rounded-full bg-border" />
                    <div className="h-2 w-3/4 rounded-full bg-border" />
                  </div>
                </div>
                <ul aria-hidden="true" className="grid gap-2">
                  {placeholderRows.map((width) => (
                    <li key={width} className="flex items-center gap-2 py-0.5">
                      <span className="size-4 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
                      <span
                        className={cn("h-2 rounded-full bg-border", width)}
                      />
                    </li>
                  ))}
                </ul>
                <div
                  aria-hidden="true"
                  className="mt-auto h-9 w-36 rounded-[10px] border border-dashed border-muted-foreground/40"
                />
              </div>
            </PixelCard>
          </li>
        </ul>
      </section>
    </>
  );
}
