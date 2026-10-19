import { Shirt } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  cosmeticTypeOptions,
  type CosmeticTier,
} from "@/features/cosmetics/cosmetic-filters";
import {
  CosmeticIndex,
  CosmeticIndexFromUrl,
} from "@/features/cosmetics/cosmetic-index";
import { rarityOf } from "@/features/game-data/rarity";
import { fetchCosmetics } from "@/lib/nexon/cosmetic-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/cosmetics",
  title: "Cosmetics",
  description:
    "Every cosmetic of The First Descendant: skins, makeup, attachments, paints and spawns, with their tiers and the Descendants who can use them.",
});

/** Counts with a thousands separator: "1,293 cosmetics". */
const count = new Intl.NumberFormat("en-US");

export default async function CosmeticsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0039).
  const { cards, descendants } = await fetchCosmetics();
  // Tier names and colors come from the chat registry here, on the server; highest
  // first. NEXON gives some cosmetics no tier, and the filter offers none for them.
  const tiers = [
    ...new Set(
      cards.flatMap((card) => (card.tier === null ? [] : [card.tier])),
    ),
  ]
    .sort((a, b) => b.localeCompare(a, "en", { numeric: true }))
    .flatMap((id): CosmeticTier[] => {
      const rarity = rarityOf(id);
      return rarity === null ? [] : [{ id, ...rarity }];
    });
  const types = cosmeticTypeOptions(cards);
  const props = { entries: cards, tiers, types, descendants };

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Shirt aria-hidden="true" className="text-primary" />
            Every cosmetic
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Cosmetics
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {cards.length === 0
              ? "The cosmetics couldn't be loaded for this build. They come back with the next one."
              : `All ${count.format(cards.length)} cosmetics: skins, makeup, attachments, paints and spawns. Open one for its versions and who can use them, or pick a Descendant to see everything they can use.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All cosmetics"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<CosmeticIndex {...props} search="" />}>
          <CosmeticIndexFromUrl {...props} />
        </Suspense>
      </section>
    </>
  );
}
