import { Skull } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  Infiltration400,
  Infiltration400FromUrl,
  ResetCountdown,
} from "@/features/infiltration-400/operation-index";
import { fetchInfiltration400 } from "@/lib/nexon/infiltration-400";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/infiltration-400",
  title: "400% Infiltration Operations",
  description:
    "Today's two 400% Infiltration Operations in The First Descendant, the rotation in the weeks ahead, and what drops in each at 400%, with its Transcendent weapon chance.",
});

export default async function Infiltration400Page() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0049). Which day it is gets worked out in the browser.
  const operations = await fetchInfiltration400();

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Skull aria-hidden="true" className="text-primary" />
            Every 400% operation
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              400% Infiltration Operations
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {operations.length === 0
              ? "The 400% Infiltration Operations couldn't be loaded for this build. They come back with the next one."
              : "Today's two operations, the rotation in the weeks ahead, and what drops in each at 400%."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ResetCountdown />
          </div>
        </div>
      </section>
      <section
        aria-label="400% Infiltration Operations"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's choice is read in the browser; the static HTML holds the page with
            no day, the fallback (Next.js: useSearchParams in a prerendered page needs
            Suspense). */}
        <Suspense
          fallback={<Infiltration400 operations={operations} search="" />}
        >
          <Infiltration400FromUrl operations={operations} />
        </Suspense>
      </section>
    </>
  );
}
