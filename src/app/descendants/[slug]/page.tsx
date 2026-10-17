import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Cpu,
  Hammer,
  Hexagon,
  PackageSearch,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { StarBorder } from "@/components/react-bits/star-border";
import { Badge } from "@/components/ui/badge";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import { descendantChatIds } from "@/features/chat/ui/descendant-icons";
import { shareHash } from "@/features/chat/ui/share-link";
import { elementIconUrls } from "@/features/descendants/element-icons";
import { ModuleCards } from "@/features/descendants/module-cards";
import {
  ReactorCards,
  type DescendantReactor,
} from "@/features/descendants/reactor-cards";
import { rarityOf } from "@/features/game-data/rarity";
import { NeighborLinks } from "@/features/game-data/neighbor-links";
import { PageTabs, type PageTab } from "@/features/game-data/page-tabs";
import { ResearchRecipe } from "@/features/game-data/research-recipe";
import { SkillsSection } from "@/features/descendants/skills-section";
import { StatLevels } from "@/features/game-data/stat-levels";
import { ArcheIcon, ElementIcon } from "@/features/descendants/type-icons";
import {
  fetchDescendantPage,
  fetchDescendantSummaries,
} from "@/lib/nexon/descendant-page";
import { fetchReactorGroups } from "@/lib/nexon/reactor-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** The game's own color for Ultimate characters, verified in game (chat-tags.json). */
const ultimateColor =
  chatRegistry.tagsByName.get("ultimatecharacter")?.hex ?? palette.primary;

// A page for every Descendant in NEXON's data, built at build time (ADR 0023); any other
// slug is a 404.
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await fetchDescendantSummaries()).map((descendant) => ({
    slug: descendant.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/descendants/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchDescendantPage(slug);
  return pageMetadata({
    path: `/descendants/${slug}`,
    title: page?.name ?? "Descendant",
    description:
      page === null
        ? "A Descendant of The First Descendant."
        : `${page.name}'s stats at every level, skills, exclusive modules and research recipe.`,
  });
}

export default async function DescendantPage({
  params,
}: PageProps<"/descendants/[slug]">) {
  const { slug } = await params;
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008). If NEXON has no such Descendant, or is down, the page is a 404.
  const [page, reactorGroups] = await Promise.all([
    fetchDescendantPage(slug),
    fetchReactorGroups(),
  ]);
  if (page === null) {
    notFound();
  }
  // The reactors that suit it (`reactorMatch`, ADR 0026), with its skills of their
  // attribute and Arche type, in their highest tier's art and color.
  const reactors: DescendantReactor[] = reactorGroups.flatMap((group) => {
    const skills = page.skills
      .filter(
        (skill) =>
          skill.element === group.attribute &&
          skill.archeType === group.archeType,
      )
      .map((skill) => skill.name);
    const top = group.versions.at(0);
    return group.attribute === null ||
      group.archeType === null ||
      top === undefined ||
      !group.descendants.some((entry) => entry.slug === page.slug)
      ? []
      : [
          {
            slug: group.slug,
            name: group.name,
            imageUrl: top.imageUrl,
            hex: rarityOf(top.tier)?.hex ?? palette.primary,
            attribute: group.attribute,
            archeType: group.archeType,
            skills,
          },
        ];
  });
  const chatId = descendantChatIds().get(page.name);
  const chatHash =
    chatId === undefined ? null : shareHash(`<img id="${chatId}"/>`, "normal");
  const elementIcons = elementIconUrls(page.elements);
  // Transcendent modules for the skills' switch, with their rarity colors resolved here
  // so the client component never loads the chat registry.
  const transcendent = page.modules.flatMap((module) =>
    module.transcendent
      ? [{ module, hex: rarityOf(module.tier)?.hex ?? palette.primary }]
      : [],
  );
  const ultimateOnly = page.modules.filter(
    (module) => module.ultimateOnly,
  ).length;
  const firstLevel = page.levels.at(0);
  const lastLevel = page.levels.at(-1);
  // The hero's quick look: the first three stats that are not zero at the top level.
  const keyStats = page.stats
    .filter((stat) => (stat.values.at(-1) ?? 0) > 0)
    .slice(0, 3);
  const summary = [
    firstLevel === undefined || lastLevel === undefined
      ? null
      : `Stats for levels ${String(firstLevel)}–${String(lastLevel)}`,
    `${String(page.skills.length)} skills`,
    page.modules.length === 0
      ? null
      : `${String(page.modules.length)} exclusive ${page.modules.length === 1 ? "module" : "modules"}`,
    page.research === null ? null : "the research recipe",
  ]
    .filter((part) => part !== null)
    .join(", ")
    .replace(/, ([^,]*)$/, " and $1");
  // The page's sections, as tabs (ADR 0029); Reactors and Research only when there are some.
  const tabs: PageTab[] = [
    {
      id: "stats",
      label: "Stats",
      icon: <Activity />,
      description: "At every level. Drag the slider to see how they grow.",
      content: (
        <StatLevels
          name={page.name}
          levels={page.levels}
          stats={page.stats}
          baseName={page.baseName}
        />
      ),
    },
    {
      id: "skills",
      label: "Skills",
      icon: <Sparkles />,
      description: `All ${String(page.skills.length)} of ${page.name}'s skills.`,
      content: (
        <SkillsSection
          skills={page.skills}
          modules={transcendent}
          elementIcons={elementIcons}
        />
      ),
    },
    {
      id: "modules",
      label: "Modules",
      title: "Exclusive modules",
      icon: <Cpu />,
      description:
        page.baseName === null || ultimateOnly === 0
          ? `Modules only ${page.name} can equip.`
          : `Modules only ${page.name} can equip, ${String(ultimateOnly)} of them not available to ${page.baseName}.`,
      content:
        page.modules.length === 0 ? (
          <p className="text-muted-foreground">
            No modules are exclusive to {page.name}.
          </p>
        ) : (
          <ModuleCards modules={page.modules} ultimateColor={ultimateColor} />
        ),
    },
    ...(reactors.length === 0
      ? []
      : [
          {
            id: "reactors",
            label: "Reactors",
            icon: <Hexagon />,
            description: `The ${String(reactors.length)} reactors whose attribute and Arche type match ${page.name}'s.`,
            content: (
              <ReactorCards
                reactors={reactors}
                attributeIcons={elementIconUrls(
                  reactors.map((reactor) => reactor.attribute),
                )}
              />
            ),
          },
        ]),
    ...(page.research === null
      ? []
      : [
          {
            // Named for where the Descendant comes from: its research (T7SEN, 2026-10-17).
            id: "obtain",
            label: "How to obtain",
            icon: <PackageSearch />,
            description: `What researching ${page.name} takes, part by part.`,
            content: <ResearchRecipe name={page.name} recipe={page.research} />,
          },
        ]),
    {
      id: "builds",
      label: "Builds",
      icon: <Hammer />,
      description: `Builds for ${page.name} are coming to ArcheLab.`,
      content: (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed bg-card/40 p-5">
          <p className="max-w-xl text-sm text-muted-foreground">
            Descendant builds are the next tool on the way. When they land,
            builds for {page.name} show here.
          </p>
          <Link
            href="/#coming-soon"
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card/60 px-4 py-2 text-sm font-semibold transition-colors outline-none hover:border-ring/60 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            What&apos;s coming
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden">
        <HeroBackdrop />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pt-[calc(var(--site-header-height)+2.5rem)] pb-8 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:items-center lg:pt-[calc(var(--site-header-height)+3.5rem)]">
          <div className="relative mx-auto w-full max-w-64 overflow-hidden rounded-3xl border bg-card/60 shadow-2xl shadow-primary/20 md:max-w-none">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_srgb,var(--primary)_35%,transparent),transparent_70%)]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
            <img
              src={page.imageUrl}
              alt={`${page.name}'s portrait`}
              width={256}
              height={256}
              fetchPriority="high"
              className="relative aspect-square w-full object-cover"
            />
          </div>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/descendants"
                className="inline-flex items-center gap-1.5 rounded-sm text-sm hero-text transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                All Descendants
              </Link>
              {page.ultimate ? (
                <Badge
                  variant="secondary"
                  style={{
                    color: ultimateColor,
                    borderColor: `color-mix(in srgb, ${ultimateColor} 45%, transparent)`,
                  }}
                >
                  <UserRound aria-hidden="true" />
                  Ultimate Descendant
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <UserRound aria-hidden="true" className="text-primary" />
                  Descendant
                </Badge>
              )}
            </div>
            {page.pair === null ? null : (
              // The pair as links: each member has its own page (ADR 0023).
              <nav aria-label={`${page.pair[0].name} and ${page.pair[1].name}`}>
                <ul className="inline-flex rounded-full border bg-card/60 p-1 backdrop-blur-md">
                  {page.pair.map((member) => {
                    const current = member.slug === page.slug;
                    return (
                      <li key={member.slug}>
                        <Link
                          href={`/descendants/${member.slug}`}
                          aria-current={current ? "page" : undefined}
                          className="inline-flex rounded-full px-3 py-1 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-primary/15 aria-[current=page]:text-foreground"
                          style={
                            current && member.ultimate
                              ? { color: ultimateColor }
                              : undefined
                          }
                        >
                          {member.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
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
              {page.elements.length === 0 ? null : (
                <div className="flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1">
                  <dt className="text-muted-foreground">Attribute</dt>
                  {page.elements.map((element) => (
                    <dd
                      key={element}
                      className="flex items-center gap-1.5 font-medium"
                    >
                      <ElementIcon
                        url={elementIcons[element]}
                        className="size-5"
                      />
                      {element}
                    </dd>
                  ))}
                </div>
              )}
              {page.archeTypes.length === 0 ? null : (
                <div className="flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1">
                  <dt className="text-muted-foreground">Arche type</dt>
                  {page.archeTypes.map((archeType) => (
                    <dd
                      key={archeType}
                      className="flex items-center gap-1.5 font-medium"
                    >
                      <ArcheIcon archeType={archeType} className="size-4" />
                      {archeType}
                    </dd>
                  ))}
                </div>
              )}
            </dl>
            <p className="max-w-xl hero-text">{summary}.</p>
            {keyStats.length === 0 || lastLevel === undefined ? null : (
              // A `<dl>` has no role that takes a name, so a group carries it.
              <div role="group" aria-label={`At level ${String(lastLevel)}`}>
                <dl className="grid max-w-xl grid-cols-3 gap-2">
                  {keyStats.map((stat) => (
                    <div
                      key={stat.name}
                      className="grid gap-0.5 rounded-xl border bg-card/60 px-3 py-2 backdrop-blur-md"
                    >
                      <dt className="truncate text-xs text-muted-foreground">
                        {stat.name}
                      </dt>
                      <dd className="font-display text-xl font-semibold tabular-nums">
                        {numberFormat.format(stat.values.at(-1) ?? 0)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {chatHash === null ? null : (
              <div className="flex flex-wrap items-center gap-3">
                <StarBorder
                  href={`/tools/chat${chatHash}`}
                  radius={10}
                  thickness={1.5}
                  glow={0.9}
                  backgroundColor="color-mix(in srgb, var(--primary) 22%, var(--card))"
                  className="px-5 py-3 text-sm font-semibold"
                >
                  Use {page.name}&apos;s icon in chat
                  <ArrowRight aria-hidden="true" className="size-4" />
                </StarBorder>
              </div>
            )}
          </div>
        </div>
      </section>

      <PageTabs label={`${page.name}'s sections`} tabs={tabs} />

      <NeighborLinks
        label="More Descendants"
        basePath="/descendants"
        previous={page.previous}
        next={page.next}
      />
    </>
  );
}
