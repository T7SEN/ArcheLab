import { Hexagon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { elementIconUrls } from "@/features/descendants/element-icons";
import { rarityOf } from "@/features/game-data/rarity";
import type { ReactorCard } from "@/features/reactors/reactor-filters";
import {
  ReactorIndex,
  ReactorIndexFromUrl,
} from "@/features/reactors/reactor-index";
import { fetchReactorGroups } from "@/lib/nexon/reactor-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/reactors",
  title: "Reactors",
  description:
    "Every reactor of The First Descendant, with Skill Power at every level and tier, and the Descendants whose skills it suits.",
});

/** The Descendants index's orders; anything NEXON adds later follows, A–Z. */
const attributeOrder = ["Fire", "Chill", "Electric", "Toxic", "Non-Attribute"];
const archeOrder = ["Fusion", "Singular", "Dimension", "Tech"];

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

export default async function ReactorsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0026). Levels stay out of the page: each reactor's are in its own
  // data file, loaded when its details open.
  const groups = await fetchReactorGroups();
  const attributes = ordered(
    groups.flatMap((group) =>
      group.attribute === null ? [] : [group.attribute],
    ),
    attributeOrder,
  );
  const archeTypes = ordered(
    groups.flatMap((group) =>
      group.archeType === null ? [] : [group.archeType],
    ),
    archeOrder,
  );
  // Tier names and colors come from the chat registry here, on the server.
  const entries: ReactorCard[] = groups.map((group) => ({
    slug: group.slug,
    name: group.name,
    attribute: group.attribute,
    archeType: group.archeType,
    boosts: group.boosts,
    tiers: group.versions.map((version) => {
      const rarity = rarityOf(version.tier);
      return {
        id: version.id,
        name: rarity?.name ?? version.tier,
        hex: rarity?.hex ?? palette.primary,
        imageUrl: version.imageUrl,
      };
    }),
    descendants: group.descendants.map((descendant) => ({
      slug: descendant.slug,
      name: descendant.name,
      imageUrl: descendant.imageUrl,
    })),
  }));
  const indexProps = {
    entries,
    attributes,
    attributeIcons: elementIconUrls(attributes),
    archeTypes,
  };

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Hexagon aria-hidden="true" className="text-primary" />
            Every reactor
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Reactors
            </ShinyText>
          </h1>
          <p className="text-scrim mt-3 max-w-2xl text-muted-foreground">
            {groups.length === 0
              ? "The reactors couldn't be loaded for this build. They come back with the next one."
              : `All ${String(groups.length)} reactors, each in ${String(groups.at(0)?.versions.length ?? 0)} tiers. Open one for its Skill Power at every level, and the Descendants whose skills it suits.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All reactors"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense fallback={<ReactorIndex {...indexProps} search="" />}>
          <ReactorIndexFromUrl {...indexProps} />
        </Suspense>
      </section>
    </>
  );
}
