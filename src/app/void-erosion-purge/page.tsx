import { Biohazard } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  VoidErosionPurge,
  VoidErosionPurgeFromUrl,
} from "@/features/void-erosion-purge/purge-index";
import { fetchVoidErosionPurge } from "@/lib/nexon/void-erosion-purge";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/void-erosion-purge",
  title: "Void Erosion Purge",
  description:
    "Today's Void Erosion Purge Stage 10 map in The First Descendant, the five-map rotation in your time, and what every Normal and Challenge stage gives.",
});

export default async function VoidErosionPurgePage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0053). Which day it is gets worked out in the browser.
  const { maps, stages } = await fetchVoidErosionPurge();

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Biohazard aria-hidden="true" className="text-primary" />
            Stage 10 rotation
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Void Erosion Purge
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            Today&apos;s Stage 10 map, the five-map rotation in your time, and
            what every stage gives.
          </p>
        </div>
      </section>
      <section
        aria-label="Void Erosion Purge"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's choice is read in the browser; the static HTML holds the page with
            no day, the fallback (Next.js: useSearchParams in a prerendered page needs
            Suspense). */}
        <Suspense
          fallback={<VoidErosionPurge maps={maps} stages={stages} search="" />}
        >
          <VoidErosionPurgeFromUrl maps={maps} stages={stages} />
        </Suspense>
      </section>
    </>
  );
}
