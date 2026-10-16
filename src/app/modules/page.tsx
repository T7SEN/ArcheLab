import { Cpu } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import type { ModuleCard } from "@/features/modules/module-filters";
import { tierOptions, versionTier } from "@/features/modules/module-tiers";
import {
  ModuleIndex,
  ModuleIndexFromUrl,
  type ModuleIndexOptions,
} from "@/features/modules/module-index";
import {
  fetchModuleGroups,
  moduleCategoryOrder,
} from "@/lib/nexon/module-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/modules",
  title: "Modules",
  description:
    "Every module of The First Descendant, with its capacity and effect at every level, and filters by tier, class, socket, slot and type.",
});

/** The slot filter's order, as a Descendant's module slots run. */
const slotOrder = ["Main", "Skill", "Sub", "Trigger"];

/** Known names first in their order, then any others, A–Z. */
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

const count = (value: number) => value.toLocaleString("en-US");

export default async function ModulesPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0025). Levels stay out of the page: each group's are in its own
  // data file, loaded when its details open.
  const groups = await fetchModuleGroups();
  const variants = groups.flatMap((group) => group.variants);

  // Tier names and colors come from the chat registry here, on the server, so the client
  // never loads it (`module-tiers.ts`).
  const options: ModuleIndexOptions = {
    tiers: tierOptions(variants),
    sockets: ordered(
      variants.flatMap((variant) =>
        variant.socket === null ? [] : [variant.socket],
      ),
      [],
    ),
    categories: ordered(
      // Any class NEXON adds later follows the known ones, A–Z.
      variants.map((variant) => variant.category),
      moduleCategoryOrder,
    ),
    types: ordered(
      variants.flatMap((variant) =>
        variant.type === null ? [] : [variant.type],
      ),
      [],
    ),
    slots: ordered(
      variants.flatMap((variant) => variant.slots),
      slotOrder,
    ),
    owners: [
      ...new Map(
        variants
          .flatMap((variant) => variant.owners)
          .map((owner) => [owner.slug, { slug: owner.slug, name: owner.name }]),
      ).values(),
    ].sort((a, b) => a.name.localeCompare(b.name)),
  };
  const entries: ModuleCard[] = groups.map((group) => ({
    slug: group.slug,
    name: group.name,
    variants: group.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      category: variant.category,
      rounds: variant.rounds,
      weaponTypes: variant.weaponTypes,
      tier: versionTier(variant).name,
      socket: variant.socket,
      type: variant.type,
      slots: variant.slots,
      owners: variant.owners.map((owner) => ({
        slug: owner.slug,
        name: owner.name,
      })),
      imageUrl: variant.imageUrl,
      capacity: variant.capacity,
    })),
  }));

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Cpu aria-hidden="true" className="text-primary" />
            Every module
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Modules
            </ShinyText>
          </h1>
          <p className="text-scrim mt-3 max-w-2xl text-muted-foreground">
            {groups.length === 0
              ? "The modules couldn't be loaded for this build. They come back with the next one."
              : `All ${count(groups.length)} modules, ${count(variants.length)} counting each version for a rounds type, weapon or melee. Open one for its capacity and effect at every level.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All modules"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense
          fallback={
            <ModuleIndex entries={entries} options={options} search="" />
          }
        >
          <ModuleIndexFromUrl entries={entries} options={options} />
        </Suspense>
      </section>
    </>
  );
}
