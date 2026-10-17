import { PawPrint } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { fellowArt, fellowEffects, fellowPassiveOf } from "@/data/fellows";
import type { FellowCard } from "@/features/fellows/fellow-card";
import {
  FellowShowcase,
  FellowShowcaseFromUrl,
} from "@/features/fellows/fellow-showcase";
import { rarityOf } from "@/features/game-data/rarity";
import { fetchFellows } from "@/lib/nexon/fellow-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/fellows",
  title: "Fellows",
  description:
    "Every Fellow of The First Descendant, with its passive and stats at every level, the Inversion Reinforcement effects it unlocks and its research.",
});

export default async function FellowsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0035). Three Fellows of 40 levels each come with the page.
  const fellows = await fetchFellows();
  // Tier names and colors come from the chat registry here, on the server.
  const entries: FellowCard[] = fellows.map((fellow) => {
    const rarity = rarityOf(fellow.tier);
    return {
      slug: fellow.slug,
      name: fellow.name,
      tierName: rarity?.name ?? fellow.tier,
      hex: rarity?.hex ?? palette.primary,
      imageUrl: fellowArt[fellow.name] ?? null,
      passive: fellowPassiveOf[fellow.name] ?? null,
      levels: fellow.levels,
      effect: fellowEffects[fellow.name] ?? null,
      research: fellow.research,
    };
  });
  const maxLevel = Math.max(
    0,
    ...fellows.map((fellow) => fellow.levels.at(-1)?.level ?? 0),
  );

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <PawPrint aria-hidden="true" className="text-primary" />
            Every Fellow
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Fellows
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {fellows.length === 0
              ? "The Fellows couldn't be loaded for this build. They come back with the next one."
              : `All ${String(fellows.length)} Fellows, up to level ${String(maxLevel)}. Open one for its passive and stats at every level, the Inversion Reinforcement effects it unlocks and its research.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All Fellows"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's open Fellow is read in the browser; the static HTML holds the
            cards with none open, the fallback (useSearchParams needs Suspense). */}
        <Suspense fallback={<FellowShowcase entries={entries} search="" />}>
          <FellowShowcaseFromUrl entries={entries} />
        </Suspense>
      </section>
    </>
  );
}
