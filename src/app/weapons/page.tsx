import { Crosshair } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { rarityOf } from "@/features/game-data/rarity";
import {
  WeaponIndex,
  WeaponIndexFromUrl,
} from "@/features/weapons/weapon-index";
import { fetchWeaponSummaries } from "@/lib/nexon/weapon-page";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/weapons",
  title: "Weapons",
  description:
    "Every weapon of The First Descendant, with filters by tier, type and rounds.",
});

/** The rounds filter's order; any rounds NEXON adds later follow, A–Z. */
const roundsOrder = [
  "General Rounds",
  "Enhanced Ammo",
  "Impact Rounds",
  "High-Power Rounds",
];

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

export default async function WeaponsPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0024).
  const summaries = await fetchWeaponSummaries();
  // Tier names and colors come from the chat registry here, on the server, so the client
  // grid never loads it. Summaries run highest tier first, so tiers keep that order.
  const tiers = [
    ...new Map(
      summaries.map((weapon) => {
        const rarity = rarityOf(weapon.tier);
        const name = rarity?.name ?? weapon.tier;
        return [name, { name, hex: rarity?.hex ?? palette.primary }];
      }),
    ).values(),
  ];
  const entries = summaries.map((weapon) => ({
    slug: weapon.slug,
    name: weapon.name,
    imageUrl: weapon.imageUrl,
    tier: rarityOf(weapon.tier)?.name ?? weapon.tier,
    type: weapon.type,
    rounds: weapon.rounds,
  }));
  const types = ordered(
    summaries.map((weapon) => weapon.type),
    [],
  );
  const rounds = ordered(
    summaries.flatMap((weapon) =>
      weapon.rounds === null ? [] : [weapon.rounds],
    ),
    roundsOrder,
  );

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Crosshair aria-hidden="true" className="text-primary" />
            Every weapon
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Weapons
            </ShinyText>
          </h1>
          <p className="text-scrim mt-3 max-w-2xl text-muted-foreground">
            {summaries.length === 0
              ? "The weapons couldn't be loaded for this build. They come back with the next one."
              : `All ${String(summaries.length)} weapons in ${String(types.length)} types. Each page has ATK at every level and every base stat, plus the unique ability and research recipe where a weapon has them.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All weapons"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's filters are read in the browser; the static HTML holds the
            unfiltered index, the fallback (Next.js: useSearchParams in a prerendered
            page needs Suspense). */}
        <Suspense
          fallback={
            <WeaponIndex
              entries={entries}
              tiers={tiers}
              types={types}
              rounds={rounds}
              search=""
            />
          }
        >
          <WeaponIndexFromUrl
            entries={entries}
            tiers={tiers}
            types={types}
            rounds={rounds}
          />
        </Suspense>
      </section>
    </>
  );
}
