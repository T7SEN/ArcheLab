import { Dna } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { mutantCellCards } from "@/features/mutant-cells/mutant-cell-filters";
import {
  MutantCellIndex,
  MutantCellIndexFromUrl,
} from "@/features/mutant-cells/mutant-cell-index";
import { fetchMutantCells } from "@/lib/nexon/mutant-cell-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/mutant-cells",
  title: "Mutant Cells",
  description:
    "Every Mutant Cell of The First Descendant, with its socket, what sets it off and its effects, and a socket filter.",
});

export default async function MutantCellsPage() {
  // NEXON's cells, fetched once while the page is prerendered and refreshed by the
  // weekly deploy; the build checks them against the update notes (ADR 0040).
  const entries = mutantCellCards(await fetchMutantCells());

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Dna aria-hidden="true" className="text-primary" />
            Every Mutant Cell
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Mutant Cells
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {entries.length === 0
              ? "The Mutant Cells couldn't be loaded for this build. They come back with the next one."
              : `All ${String(entries.length)} Mutant Cells a Mutant Cell Slot can take, by socket. Open one for its effects and numbers.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All Mutant Cells"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<MutantCellIndex entries={entries} search="" />}>
          <MutantCellIndexFromUrl entries={entries} />
        </Suspense>
      </section>
    </>
  );
}
