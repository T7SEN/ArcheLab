import { Pickaxe } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  BasicIndex,
  BasicIndexFromUrl,
} from "@/features/basic-materials/basic-index";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { rarityOf } from "@/features/game-data/rarity";
import { fetchBasicMaterials } from "@/lib/nexon/basic-material-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/basic-materials",
  title: "Basic Materials",
  description:
    "Every Basic Material of The First Descendant: what each is used for, from Descendants and weapons to Enhancement Materials, and where to find it.",
});

export default async function BasicMaterialsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0045).
  const items = await fetchBasicMaterials();
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
            <Pickaxe aria-hidden="true" className="text-primary" />
            Every Basic Material
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Basic Materials
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {items.length === 0
              ? "The Basic Materials couldn't be loaded for this build. They come back with the next one."
              : `All ${String(items.length)} Basic Materials. Open one for what it's for and where to find it.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All Basic Materials"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<BasicIndex {...props} search="" />}>
          <BasicIndexFromUrl {...props} />
        </Suspense>
      </section>
    </>
  );
}
