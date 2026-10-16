import { UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import {
  DescendantIndex,
  DescendantIndexFromUrl,
} from "@/features/descendants/descendant-index";
import { elementIconUrls } from "@/features/descendants/element-icons";
import { fetchDescendantSummaries } from "@/lib/nexon/descendant-page";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/descendants",
  title: "Descendants",
  description:
    "Every Descendant of The First Descendant, with filters by attribute, Arche type and Ultimate.",
});

/** The filters' order: NEXON's attribute names, Non-Attribute last. */
const attributeOrder = ["Fire", "Chill", "Electric", "Toxic", "Non-Attribute"];
const archeOrder = ["Fusion", "Singular", "Dimension", "Tech"];

/** Known names first in their order, then any NEXON adds later, A–Z. */
function ordered(
  values: readonly string[],
  order: readonly string[],
): string[] {
  const rank = (value: string) => {
    const at = order.indexOf(value);
    return at === -1 ? order.length : at;
  };
  return [...new Set(values)].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
}

export default async function DescendantsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0023).
  const summaries = await fetchDescendantSummaries();
  const attributes = ordered(
    summaries.flatMap((summary) => summary.elements),
    attributeOrder,
  );
  const archeTypes = ordered(
    summaries.flatMap((summary) => summary.archeTypes),
    archeOrder,
  );
  const ultimates = summaries.filter((summary) => summary.ultimate).length;
  const ultimateColor =
    chatRegistry.tagsByName.get("ultimatecharacter")?.hex ?? palette.primary;
  const indexProps = {
    entries: summaries,
    attributes,
    archeTypes,
    elementIcons: elementIconUrls(attributes),
    ultimateColor,
  };

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <UsersRound aria-hidden="true" className="text-primary" />
            Every Descendant
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Descendants
            </ShinyText>
          </h1>
          <p className="text-scrim mt-3 max-w-2xl text-muted-foreground">
            {summaries.length === 0
              ? "The Descendants couldn't be loaded for this build. They come back with the next one."
              : `All ${String(summaries.length)} Descendants, ${String(ultimates)} of them Ultimates. Each page has stats at every level, skills, exclusive modules and the research recipe.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All Descendants"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<DescendantIndex {...indexProps} search="" />}>
          <DescendantIndexFromUrl {...indexProps} />
        </Suspense>
      </section>
    </>
  );
}
