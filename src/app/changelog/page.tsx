import { CalendarDays, History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { changelog, changelogDate, changelogGroupId } from "@/data/changelog";
import { ChangelogTimeline } from "@/features/changelog/changelog-timeline";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/changelog",
  title: "Changelog",
  description:
    "What changed on ArcheLab, newest first: new tools, database pages and fixes.",
});

/**
 * The Changelog page (ADR 0036): every update from `src/data/changelog.ts`, newest
 * first, as dated cards beside a timeline, React Bits' BranchedMenu, whose rows jump to
 * each update's groups. Ideas from tfdhub.gg's changelog, in ArcheLab's look.
 */
export default function ChangelogPage() {
  const latest = changelog.at(0);

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <History aria-hidden="true" className="text-primary" />
            Changelog
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              What&apos;s new
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            Every change to ArcheLab, newest first. Something missing or broken?{" "}
            <Link
              href="/feedback"
              className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Send feedback
            </Link>
            .
          </p>
          {latest === undefined ? null : (
            <p className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-primary px-2.5 py-1 font-semibold tracking-wide text-primary-foreground uppercase">
                Latest
              </span>
              {latest.version === undefined ? null : (
                <span className="rounded-full border border-primary/50 bg-card/60 px-2.5 py-1 font-medium text-primary">
                  Version {latest.version}
                </span>
              )}
              <span className="rounded-full border bg-card/60 px-2.5 py-1 text-muted-foreground">
                Updated{" "}
                <time dateTime={latest.date}>{changelogDate(latest.date)}</time>
              </span>
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
        {/* The timeline: React Bits' BranchedMenu, a section per update opening into its
            groups. It stays in view beside the updates on wide screens. */}
        <aside className="grid content-start gap-3 lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Timeline
          </p>
          <ChangelogTimeline />
        </aside>

        <ol className="grid gap-8">
          {changelog.map((entry, index) => (
            <li key={entry.date}>
              <article
                aria-labelledby={`update-${entry.date}`}
                className="grid gap-5 rounded-2xl border bg-card/60 p-5 sm:p-6"
              >
                <header className="grid gap-2">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <CalendarDays
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    <time dateTime={entry.date}>
                      {changelogDate(entry.date)}
                    </time>
                    {entry.version === undefined ? null : (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                        Version {entry.version}
                      </span>
                    )}
                    {index === 0 ? (
                      <span className="rounded-full border border-primary/50 px-2 py-0.5 text-xs font-medium text-primary">
                        Latest
                      </span>
                    ) : null}
                  </p>
                  <h2
                    id={`update-${entry.date}`}
                    className="font-display text-2xl leading-tight font-semibold tracking-wide"
                  >
                    {entry.title}
                  </h2>
                  <p className="text-muted-foreground">{entry.summary}</p>
                </header>
                <div className="grid gap-4">
                  {entry.groups.map((group) => (
                    <section
                      key={group.title}
                      id={changelogGroupId(entry.date, group.title)}
                      aria-label={group.title}
                      className="grid scroll-mt-[calc(var(--site-header-height)+1.5rem)] content-start gap-2 rounded-xl border bg-background/40 p-4"
                    >
                      <h3 className="text-xs font-medium tracking-wide text-primary uppercase">
                        {group.title}
                      </h3>
                      <ul className="grid gap-2 text-sm leading-relaxed">
                        {group.items.map((item) => (
                          <li key={item} className="flex gap-2.5">
                            <span
                              aria-hidden="true"
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
