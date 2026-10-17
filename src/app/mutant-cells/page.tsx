import { Dna } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { mutantCells } from "@/data/mutant-cells";
import { mutantCellCards } from "@/features/mutant-cells/mutant-cell-filters";
import {
  MutantCellIndex,
  MutantCellIndexFromUrl,
} from "@/features/mutant-cells/mutant-cell-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/mutant-cells",
  title: "Mutant Cells",
  description:
    "Every Mutant Cell of The First Descendant, with its socket, what sets it off and its effects, and a socket filter.",
});

export default function MutantCellsPage() {
  // The cells are the site's own data, from the update notes (ADR 0038).
  const entries = mutantCellCards(mutantCells);

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Dna aria-hidden="true" className="text-primary" />
            Arche Tuning
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
            {`All ${String(entries.length)} Mutant Cells a Mutant Cell Slot can take, by socket. Open one for its effects and numbers.`}
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
