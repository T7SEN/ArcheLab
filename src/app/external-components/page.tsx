import { CircuitBoard } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { componentSubStatStatus } from "@/data/component-sub-stats";
import type { ComponentCard } from "@/features/external-components/component-filters";
import {
  ComponentIndex,
  ComponentIndexFromUrl,
} from "@/features/external-components/component-index";
import { rarityOf } from "@/features/game-data/rarity";
import {
  fetchComponentGroups,
  fetchComponentCoreSlots,
  fetchComponentSubStats,
} from "@/lib/nexon/component-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/external-components",
  title: "External Components",
  description:
    "Every external component set of The First Descendant, with its set effect, and each piece's base stat at every level and possible sub-stats.",
});

const tierNumber = (tier: string) => Number(tier.replace(/\D/g, "")) || 0;

export default async function ExternalComponentsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0027). Levels stay out of the page: each card's are in its own data
  // file, loaded when its details open.
  const [groups, subStatsBySlot, coreSlots] = await Promise.all([
    fetchComponentGroups(),
    fetchComponentSubStats(),
    fetchComponentCoreSlots(),
  ]);
  const tierIds = [
    ...new Set(groups.flatMap((group) => group.pieces.map((p) => p.tier))),
  ].sort((a, b) => tierNumber(b) - tierNumber(a));
  // Tier names and colors come from the chat registry here, on the server.
  const tierOf = (tierId: string) => {
    const rarity = rarityOf(tierId);
    return {
      name: rarity?.name ?? tierId,
      hex: rarity?.hex ?? palette.primary,
    };
  };
  const tiers = tierIds.map(tierOf);
  const entries: ComponentCard[] = groups.map((group) => ({
    slug: group.slug,
    name: group.name,
    kind: group.kind,
    bonuses: group.bonuses,
    pieces: group.pieces.map((piece) => {
      const tier = tierOf(piece.tier);
      return {
        id: piece.id,
        name: piece.name,
        slot: piece.slot,
        tier: tier.name,
        hex: tier.hex,
        imageUrl: piece.imageUrl,
        stat: piece.stat,
        coreSlots: piece.coreSlots,
      };
    }),
  }));
  const sets = groups.filter((group) => group.kind === "set").length;
  const indexProps = {
    entries,
    tiers,
    // Once per slot, not per piece: every tier and set of a slot shares its list.
    subStats: {
      bySlot: subStatsBySlot,
      provisional: componentSubStatStatus === "provisional",
    },
    // Once, not per piece: every Ultimate piece's slots take the same two core types.
    coreSlots,
  };

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <CircuitBoard aria-hidden="true" className="text-primary" />
            Every external component
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              External Components
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {groups.length === 0
              ? "The external components couldn't be loaded for this build. They come back with the next one."
              : `All ${String(sets)} sets, and ${String(groups.length - sets)} components with no set. Open one for its set effect, and each piece's base stat at every level and possible sub-stats.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All external components"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<ComponentIndex {...indexProps} search="" />}>
          <ComponentIndexFromUrl {...indexProps} />
        </Suspense>
      </section>
    </>
  );
}
