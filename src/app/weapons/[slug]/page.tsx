import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  FlaskConical,
  Gauge,
  Hammer,
  Hexagon,
  Sparkles,
  Swords,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { NeighborLinks } from "@/features/game-data/neighbor-links";
import { PageSection, SectionLinks } from "@/features/game-data/page-section";
import { rarityOf } from "@/features/game-data/rarity";
import { ResearchRecipe } from "@/features/game-data/research-recipe";
import { StatLevels } from "@/features/game-data/stat-levels";
import { RoundsIcon } from "@/features/weapons/rounds-icon";
import { WeaponStats } from "@/features/weapons/weapon-stats";
import {
  fetchWeaponPage,
  fetchWeaponSummaries,
  type WeaponPage,
} from "@/lib/nexon/weapon-page";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

// A page for every weapon in NEXON's data, built at build time (ADR 0024); any other
// slug is a 404.
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await fetchWeaponSummaries()).map((weapon) => ({
    slug: weapon.slug,
  }));
}

/** What the page holds, in a sentence: "The unique ability, ATK for levels 1–100 and …". */
function summaryOf(page: WeaponPage): string {
  const first = page.levels.at(0);
  const last = page.levels.at(-1);
  return [
    page.ability === null ? null : "The unique ability",
    first === undefined || last === undefined
      ? null
      : `ATK for levels ${String(first)}–${String(last)}`,
    `${String(page.stats.length)} base stats`,
    page.coreSlots === 0 ? null : "the core slot",
    page.research === null ? null : "the research recipe",
  ]
    .filter((part) => part !== null)
    .join(", ")
    .replace(/, ([^,]*)$/, " and $1");
}

export async function generateMetadata({
  params,
}: PageProps<"/weapons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchWeaponPage(slug);
  return pageMetadata({
    path: `/weapons/${slug}`,
    title: page?.name ?? "Weapon",
    description:
      page === null
        ? "A weapon of The First Descendant."
        : `${page.name}: ${summaryOf(page)}.`,
  });
}

/** The hero's quick look after ATK, by the first of these the weapon has. */
const keyStatNames = [
  "Fire Rate",
  "Attack Speed",
  "Rounds per Magazine",
  "Shell Capacity",
  "Reload Time",
  "Firearm Critical Hit Rate",
  "Melee Weapon Critical Hit Rate",
];

export default async function WeaponPageRoute({
  params,
}: PageProps<"/weapons/[slug]">) {
  const { slug } = await params;
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008). If NEXON has no such weapon, or is down, the page is a 404.
  const page = await fetchWeaponPage(slug);
  if (page === null) {
    notFound();
  }
  const rarity = rarityOf(page.tier);
  const accent = rarity?.hex ?? palette.primary;
  const lastLevel = page.levels.at(-1);
  const attack = page.attack.at(0);
  const keyStats = keyStatNames
    .flatMap((name) => page.stats.filter((stat) => stat.name === name))
    .slice(0, attack === undefined ? 3 : 2);
  const links = [
    ...(page.ability === null
      ? []
      : [{ id: "ability", label: "Unique ability" }]),
    { id: "atk", label: "ATK" },
    { id: "stats", label: "Stats" },
    ...(page.coreSlots === 0 ? [] : [{ id: "core", label: "Core slot" }]),
    ...(page.research === null ? [] : [{ id: "research", label: "Research" }]),
    { id: "builds", label: "Builds" },
  ];

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pt-[calc(var(--site-header-height)+2.5rem)] pb-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center lg:pt-[calc(var(--site-header-height)+3.5rem)]">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/weapons"
                className="text-scrim inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                All weapons
              </Link>
              <Badge variant="secondary">
                <Crosshair aria-hidden="true" className="text-primary" />
                Weapon
              </Badge>
              {rarity === null ? null : (
                <Badge
                  variant="secondary"
                  style={{
                    color: rarity.hex,
                    borderColor: `color-mix(in srgb, ${rarity.hex} 45%, transparent)`,
                  }}
                >
                  {rarity.name}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-5xl leading-none font-semibold tracking-wide sm:text-6xl">
              <ShinyText
                color={palette.foreground}
                shineColor={palette.primary}
                speed={3}
                delay={2.5}
              >
                {page.name}
              </ShinyText>
            </h1>
            <dl className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{page.type}</dd>
              </div>
              {page.rounds === null ? null : (
                <div className="flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1">
                  <dt className="text-muted-foreground">Rounds</dt>
                  <dd className="flex items-center gap-1.5 font-medium">
                    <RoundsIcon rounds={page.rounds} className="size-5" />
                    {page.rounds}
                  </dd>
                </div>
              )}
            </dl>
            <p className="text-scrim max-w-xl text-muted-foreground">
              {summaryOf(page)}.
            </p>
            {/* A `<dl>` has no role that takes a name, so a group carries it. */}
            <div role="group" aria-label="Key stats">
              <dl className="grid max-w-xl grid-cols-3 gap-2">
                {attack === undefined || lastLevel === undefined ? null : (
                  <div className="grid content-between gap-0.5 rounded-xl border bg-card/60 px-3 py-2 backdrop-blur-md">
                    <dt className="text-xs leading-tight text-muted-foreground">
                      {attack.name}, level {lastLevel}
                    </dt>
                    <dd className="font-display text-xl font-semibold tabular-nums">
                      {numberFormat.format(attack.values.at(-1) ?? 0)}
                    </dd>
                  </div>
                )}
                {keyStats.map((stat) => (
                  <div
                    key={stat.name}
                    className="grid content-between gap-0.5 rounded-xl border bg-card/60 px-3 py-2 backdrop-blur-md"
                  >
                    <dt className="text-xs leading-tight text-muted-foreground">
                      {stat.name}
                    </dt>
                    <dd className="font-display text-xl font-semibold tabular-nums">
                      {numberFormat.format(stat.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {/* NEXON's weapon art is a wide 1024 by 304 banner; on phones it comes first. */}
          <div
            className="relative order-first overflow-hidden rounded-3xl border bg-card/60 p-4 shadow-2xl sm:p-6 md:order-none"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 40%, var(--border))`,
              boxShadow: `0 25px 50px -12px color-mix(in srgb, ${accent} 25%, transparent)`,
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(ellipse at 50% 55%, color-mix(in srgb, ${accent} 30%, transparent), transparent 70%)`,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
            <img
              src={page.imageUrl}
              alt={`${page.name}'s art`}
              width={1024}
              height={304}
              fetchPriority="high"
              className="relative aspect-[1024/304] w-full object-contain"
            />
          </div>
        </div>
        <SectionLinks label={`${page.name}'s sections`} links={links} />
      </section>

      {page.ability === null ? null : (
        <PageSection
          id="ability"
          icon={<Sparkles />}
          title="Unique ability"
          description={`The ability only ${page.name} has.`}
        >
          <div
            className="grid gap-4 rounded-2xl border bg-card/60 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6 sm:p-6"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 45%, var(--border))`,
              backgroundImage: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${accent} 14%, transparent), transparent 60%)`,
            }}
          >
            {page.ability.imageUrl === null ? null : (
              // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
              <img
                src={page.ability.imageUrl}
                alt=""
                width={256}
                height={256}
                loading="lazy"
                decoding="async"
                className="size-20 rounded-2xl border bg-background/60 object-contain p-2"
              />
            )}
            <div className="grid content-start gap-2">
              <h3
                className="font-display text-2xl font-semibold tracking-wide"
                style={{ color: accent }}
              >
                {page.ability.name}
              </h3>
              <p className="leading-relaxed whitespace-pre-line text-foreground/85">
                {page.ability.description}
              </p>
            </div>
          </div>
        </PageSection>
      )}

      <PageSection
        id="atk"
        icon={<Swords />}
        title="ATK"
        description="At every level. Drag the slider to see how it grows."
      >
        {page.attack.length === 0 ? (
          <p className="text-muted-foreground">
            {page.name} has no ATK values.
          </p>
        ) : (
          <StatLevels
            name={page.name}
            levels={page.levels}
            stats={page.attack}
            what="ATK"
          />
        )}
      </PageSection>

      <PageSection
        id="stats"
        icon={<Gauge />}
        title="Stats"
        description="Every base stat, grouped by what it does."
      >
        <WeaponStats stats={page.stats} />
      </PageSection>

      {page.coreSlots === 0 ? null : (
        <PageSection
          id="core"
          icon={<Hexagon />}
          title="Core slot"
          description={`${page.name} has ${page.coreSlots === 1 ? "one core slot" : `${String(page.coreSlots)} core slots`}.`}
        >
          <p className="max-w-2xl rounded-2xl border border-dashed bg-card/40 p-5 text-sm text-muted-foreground">
            Which core types fit {page.name}&apos;s slot isn&apos;t known yet,
            so they aren&apos;t listed.
          </p>
        </PageSection>
      )}

      {page.research === null ? null : (
        <PageSection
          id="research"
          icon={<FlaskConical />}
          title="Research"
          description={`What researching ${page.name} takes, part by part.`}
        >
          <ResearchRecipe name={page.name} recipe={page.research} />
        </PageSection>
      )}

      <PageSection
        id="builds"
        icon={<Hammer />}
        title="Builds"
        description={`Builds for ${page.name} are coming to ArcheLab.`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed bg-card/40 p-5">
          <p className="max-w-xl text-sm text-muted-foreground">
            Weapon builds are on the way. When they land, builds for {page.name}{" "}
            show here.
          </p>
          <Link
            href="/#coming-soon"
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card/60 px-4 py-2 text-sm font-semibold transition-colors outline-none hover:border-ring/60 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            What&apos;s coming
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </PageSection>
      <NeighborLinks
        label="More weapons"
        basePath="/weapons"
        previous={page.previous}
        next={page.next}
      />
    </>
  );
}
