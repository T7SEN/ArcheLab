import {
  BookOpen,
  Info,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { siteOperator } from "@/data/legal";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About",
  description:
    "What ArcheLab is, what you can do on it, and how its facts are kept right.",
});

/** When this page's wording last changed. */
const aboutUpdated = "17 October 2026";

const linkClass =
  "rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

/** A link to another page of the site, in running text. */
function PageLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

/**
 * The page's sections, in order. The copy states only what the site does and how; it
 * names no data source (AGENTS.md: only the footer's attribution and the legal pages
 * name NEXON).
 */
const sections: readonly {
  id: string;
  title: string;
  icon: ReactNode;
  body: ReactNode;
}[] = [
  {
    id: "what",
    title: "What ArcheLab is",
    icon: <Sparkles />,
    body: (
      <>
        <p>
          ArcheLab started with one tool, the chat message builder, and grew
          into a database of the game. It&apos;s made by {siteOperator}, and
          it&apos;s free: no accounts, no ads, nothing to sign up for.
        </p>
        <p>More tools are on the way: Descendant builds and weapon builds.</p>
      </>
    ),
  },
  {
    id: "tools",
    title: "What you can do here",
    icon: <Wrench />,
    body: (
      <ul>
        <li>
          <PageLink href="/tools/chat">Chat message builder</PageLink>: write
          colored chat messages with the game&apos;s chat tags, see them as the
          game shows them, and copy markup that fits the chat limit.
        </li>
        <li>
          <PageLink href="/database">Database</PageLink>: search every
          Descendant, weapon, module, reactor, external component, Fellow,
          vehicle, Mutant Cell, cosmetic, material and core at once.
        </li>
        <li>
          Command palette: press Ctrl+K on any page to jump to a page or an
          item.
        </li>
      </ul>
    ),
  },
  {
    id: "facts",
    title: "Where the facts come from",
    icon: <BookOpen />,
    body: (
      <>
        <p>
          Stats, names and numbers come from the game&apos;s own data and its
          official update notes, refreshed every week. What those don&apos;t say
          is checked in game: the chat tags and colors were tested in game, and
          things like each weapon&apos;s core slots are checked one by one.
        </p>
        <p>
          Nothing is guessed. Anything not checked yet is marked as provisional
          until it is.
        </p>
      </>
    ),
  },
  {
    id: "help",
    title: "Corrections and help",
    icon: <LifeBuoy />,
    body: (
      <>
        <p>
          Spotted something wrong, or have an idea?{" "}
          <PageLink href="/feedback">Send feedback</PageLink>.
        </p>
        <p>
          Some things only show in game. If you can check one,{" "}
          <PageLink href="/contribute">Help fill in data</PageLink> lists
          what&apos;s missing; a report goes on the site once its screenshot is
          checked.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Your privacy",
    icon: <ShieldCheck />,
    body: (
      <p>
        ArcheLab has no accounts, cookies, analytics, ads or tracking. Templates
        you save in the chat builder stay in your browser. The{" "}
        <PageLink href="/privacy">privacy policy</PageLink> has the details.
      </p>
    ),
  },
  {
    id: "unofficial",
    title: "Unofficial",
    icon: <Info />,
    body: (
      <p>
        ArcheLab is an unofficial fan site. The{" "}
        <PageLink href="/legal">legal notice</PageLink> says who runs it and how
        it relates to the game.
      </p>
    ),
  },
];

/**
 * The About page (ADR 0036): what ArcheLab is, what it offers, where its facts come
 * from, and where to send corrections. Ideas from tfdhub.gg's About page (a column that
 * stays in view beside the sections), in ArcheLab's look.
 */
export default function AboutPage() {
  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Info aria-hidden="true" className="text-primary" />
            About
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              About ArcheLab
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            Free player tools and game data for The First Descendant, made by{" "}
            {siteOperator}.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        {/* Stays in view beside the sections on wide screens. */}
        <aside className="grid content-start gap-4 lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
          <nav
            aria-label="On this page"
            className="grid gap-2 rounded-2xl border bg-card/60 p-4"
          >
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              On this page
            </p>
            <ul className="grid gap-1 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:text-primary"
                  >
                    <span aria-hidden="true" className="contents">
                      {section.icon}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="px-1 text-xs text-muted-foreground">
            Last updated {aboutUpdated}
          </p>
        </aside>

        <div className="grid gap-5">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="grid scroll-mt-[calc(var(--site-header-height)+1.5rem)] gap-3 rounded-2xl border bg-card/60 p-5 leading-relaxed text-foreground/85 sm:p-6 [&_li]:pl-1 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5"
            >
              <h2
                id={`${section.id}-title`}
                className="flex items-center gap-3 font-display text-2xl font-semibold tracking-wide text-foreground"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary [&>svg]:size-4.5"
                >
                  {section.icon}
                </span>
                {section.title}
              </h2>
              {section.body}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
