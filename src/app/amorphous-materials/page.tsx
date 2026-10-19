import { PackageOpen } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  AmorphousIndex,
  AmorphousIndexFromUrl,
} from "@/features/amorphous/amorphous-index";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { rarityOf } from "@/features/game-data/rarity";
import { fetchAmorphousPatterns } from "@/lib/nexon/amorphous-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/amorphous-materials",
  title: "Amorphous Materials",
  description:
    "Every Amorphous Material Pattern of The First Descendant, what it opens into and at what chance, the best patterns for the Descendant or weapon you're building, and the Shape Stabilizers with what each researches.",
});

export default async function AmorphousMaterialsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0041).
  const { patterns, stabilizers } = await fetchAmorphousPatterns();
  // Tier names and colors come from the chat registry here, on the server.
  const tiers = [
    ...new Set([...patterns, ...stabilizers].map((entry) => entry.tier)),
  ].flatMap((id): CosmeticTier[] => {
    const rarity = rarityOf(id);
    return rarity === null ? [] : [{ id, ...rarity }];
  });
  const props = { entries: patterns, stabilizers, tiers };

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <PackageOpen aria-hidden="true" className="text-primary" />
            Every Amorphous Material
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Amorphous Materials
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {patterns.length === 0
              ? "The Amorphous Materials couldn't be loaded for this build. They come back with the next one."
              : `All ${String(patterns.length)} Amorphous Material Patterns and the ${String(stabilizers.length)} Shape Stabilizers. Open a pattern for what it opens into, at what chance, and where to find it, or a Shape Stabilizer for what it researches and where to find it.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All Amorphous Materials"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<AmorphousIndex {...props} search="" />}>
          <AmorphousIndexFromUrl {...props} />
        </Suspense>
      </section>
    </>
  );
}
