import { Radar } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  AxionOperationalAreas,
  AxionOperationalAreasFromUrl,
} from "@/features/axion/axion-index";
import { fetchAxionOperationalAreas } from "@/lib/nexon/axion-operational-areas";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/axion-operational-areas",
  title: "Axion Operational Areas",
  description:
    "The two Axion Plains Operational Area missions active now in The First Descendant, the rotation in your time, and what drops in each, with its Amorphous Material Pattern and Transcendent weapon chance.",
});

export default async function AxionOperationalAreasPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0052). Which rotation it is gets worked out in the browser.
  const missions = await fetchAxionOperationalAreas();

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Radar aria-hidden="true" className="text-primary" />
            Axion Plains
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Axion Operational Areas
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {missions.length === 0
              ? "The Axion Operational Areas couldn't be loaded for this build. They come back with the next one."
              : "The two missions active now, every rotation in your time, and what drops in each."}
          </p>
        </div>
      </section>
      <section
        aria-label="Axion Operational Areas"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's choice is read in the browser; the static HTML holds the page with
            no rotation, the fallback (Next.js: useSearchParams in a prerendered page
            needs Suspense). */}
        <Suspense
          fallback={<AxionOperationalAreas missions={missions} search="" />}
        >
          <AxionOperationalAreasFromUrl missions={missions} />
        </Suspense>
      </section>
    </>
  );
}
