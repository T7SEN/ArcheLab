import { Shapes } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { rarityOf } from "@/features/game-data/rarity";
import {
  MiscIndex,
  MiscIndexFromUrl,
} from "@/features/miscellaneous/misc-index";
import { fetchMiscellaneous } from "@/lib/nexon/miscellaneous-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/miscellaneous",
  title: "Miscellaneous",
  description:
    "Every Miscellaneous item of The First Descendant: loot boxes, coins, vouchers, keys and Code Analyzers, and where to find each.",
});

export default async function MiscellaneousPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0050).
  const items = await fetchMiscellaneous();
  // Tier names and colors come from the chat registry here, on the server; highest
  // first.
  const tiers = [...new Set(items.map((item) => item.tier))]
    .sort((a, b) => b.localeCompare(a, "en", { numeric: true }))
    .flatMap((id): CosmeticTier[] => {
      const rarity = rarityOf(id);
      return rarity === null ? [] : [{ id, ...rarity }];
    });
  const props = { entries: items, tiers };

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Shapes aria-hidden="true" className="text-primary" />
            Every Miscellaneous item
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Miscellaneous
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {items.length === 0
              ? "The Miscellaneous items couldn't be loaded for this build. They come back with the next one."
              : `All ${String(items.length)} Miscellaneous items: loot boxes, coins, vouchers, keys and more. Open one for where to find it.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All Miscellaneous items"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<MiscIndex {...props} search="" />}>
          <MiscIndexFromUrl {...props} />
        </Suspense>
      </section>
    </>
  );
}
