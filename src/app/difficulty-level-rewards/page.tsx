import { CalendarClock } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { elementIconUrls } from "@/features/descendants/element-icons";
import {
  RewardIndex,
  RewardIndexFromUrl,
} from "@/features/difficulty-rewards/reward-index";
import { fetchDifficultyRewards } from "@/lib/nexon/difficulty-rewards";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/difficulty-level-rewards",
  title: "Difficulty Level Rewards",
  description:
    "This week's Difficulty Level Reward in every battlefield of The First Descendant, every coming week that's published, where each reactor and external component slot is a reward, and what drops in each battlefield.",
});

export default async function DifficultyLevelRewardsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0048). Which week it is gets worked out in the browser: the page is
  // built on Mondays, and the rewards change on Tuesdays.
  const data = await fetchDifficultyRewards();
  // Drops stay out of the page: each battlefield's are in its own data file.
  const props = {
    battlefields: data.battlefields,
    regions: data.regions,
    rotations: data.rotations,
    attributes: data.attributes,
    attributeIcons: elementIconUrls(data.attributes),
    archeTypes: data.archeTypes,
    slots: data.slots,
    descendants: data.descendants,
  };

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <CalendarClock aria-hidden="true" className="text-primary" />
            Every battlefield
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Difficulty Level Rewards
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {data.battlefields.length === 0
              ? "The Difficulty Level Rewards couldn't be loaded for this build. They come back with the next one."
              : `This week's reward in all ${String(data.battlefields.length)} battlefields, region by region, and in every coming week that's published. Pick a reactor, an external component or a Descendant to see where it's a reward each week, or open a battlefield for what drops there.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All battlefields"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered page with no week, the fallback (Next.js: useSearchParams in a
            prerendered page needs Suspense). */}
        <Suspense fallback={<RewardIndex {...props} search="" />}>
          <RewardIndexFromUrl {...props} />
        </Suspense>
      </section>
    </>
  );
}
