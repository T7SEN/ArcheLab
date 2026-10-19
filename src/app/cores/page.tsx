import { Atom } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { CoreIndex, CoreIndexFromUrl } from "@/features/cores/core-index";
import { fetchCoreKinds } from "@/lib/nexon/core-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/cores",
  title: "Cores",
  description:
    "Every core of The First Descendant, what it rolls at grades I to X on each weapon type, where to find it, and the Ultimate weapons and external components it applies to.",
});

export default async function CoresPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0044).
  const kinds = await fetchCoreKinds();

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Atom aria-hidden="true" className="text-primary" />
            Every core
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Cores
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {kinds.length === 0
              ? "The cores couldn't be loaded for this build. They come back with the next one."
              : `All ${String(kinds.length)} cores for Ultimate weapons and external components. Open one for what it rolls at grades I to X, where to find it and what it applies to.`}
          </p>
        </div>
      </section>
      <section aria-label="All cores" className="mx-auto max-w-6xl px-4 py-10">
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<CoreIndex entries={kinds} search="" />}>
          <CoreIndexFromUrl entries={kinds} />
        </Suspense>
      </section>
    </>
  );
}
