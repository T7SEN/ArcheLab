import { Timer } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { bountyTargets, hqOrderCycles } from "@/data/timers";
import { elementIconUrls } from "@/features/descendants/element-icons";
import { Timers, TimersFromUrl } from "@/features/timers/timers-index";
import { fetchDatabaseItems } from "@/lib/nexon/database-items";
import { fetchItemHrefs } from "@/lib/nexon/difficulty-rewards";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/timers",
  title: "Timers",
  description:
    "Wall Crasher's next spawn, ETA-0, the daily and weekly resets, today's Bounty Operations target, HQ Special Orders and every running event in The First Descendant, in your time.",
});

export default async function TimersPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0054); the times are worked out in the browser.
  const [items, itemHrefs] = await Promise.all([
    fetchDatabaseItems(),
    fetchItemHrefs(),
  ]);
  // Each HQ Special Order reward's page, by its name without its count.
  const pages = new Map([
    ...items.map((item): [string, string] => [item.name, item.href]),
    ...itemHrefs,
  ]);
  const rewardHrefs = Object.fromEntries(
    [
      ...new Set(
        hqOrderCycles.flatMap((cycle) =>
          cycle.quests.flatMap((quest) =>
            quest.rewards.map((reward) => reward.replace(/^\d+x /, "")),
          ),
        ),
      ),
    ].flatMap((name) => {
      const href = pages.get(name);
      return href === undefined ? [] : [[name, href]];
    }),
  );
  const elementIcons = elementIconUrls(
    bountyTargets.map((target) => target.attribute),
  );

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Timer aria-hidden="true" className="text-primary" />
            In your time
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Timers
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            Wall Crasher, ETA-0, the resets, today&apos;s bounty, the rotations,
            HQ Special Orders and every running event, counting down.
          </p>
        </div>
      </section>
      <section aria-label="Timers" className="mx-auto max-w-6xl px-4 py-10">
        {/* The URL's choice is read in the browser; the static HTML holds the page with
            no clock, the fallback (Next.js: useSearchParams in a prerendered page needs
            Suspense). */}
        <Suspense
          fallback={
            <Timers
              elementIcons={elementIcons}
              rewardHrefs={rewardHrefs}
              search=""
            />
          }
        >
          <TimersFromUrl
            elementIcons={elementIcons}
            rewardHrefs={rewardHrefs}
          />
        </Suspense>
      </section>
    </>
  );
}
