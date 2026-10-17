import {
  ArrowRight,
  Bug,
  ExternalLink,
  Lightbulb,
  Mail,
  MessageSquareHeart,
  SearchCheck,
  Send,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  bugEmailUrl,
  bugReportUrl,
  repoUrl,
  suggestionEmailUrl,
  suggestionUrl,
} from "@/data/contribute";
import { contactEmail } from "@/data/legal";
import { PageSection } from "@/features/game-data/page-section";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/feedback",
  title: "Feedback",
  description:
    "Found a bug or have an idea for ArcheLab? Send it on GitHub or by email.",
});

const cardClass = "grid content-start gap-3 rounded-2xl border bg-card/60 p-5";
const linkClass =
  "inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

/** A kind of feedback: what it's for, and where to send it. */
function FeedbackCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={cardClass}>
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary [&>svg]:size-5"
      >
        {icon}
      </span>
      <h3 className="font-display text-xl font-semibold tracking-wide">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
        {children}
      </div>
    </section>
  );
}

/** The GitHub form, in a new tab, and the email, for one kind of feedback. */
function SendLinks({
  github,
  email,
  label,
}: {
  github: string;
  email: string;
  /** What's sent, for screen readers: "a bug". */
  label: string;
}) {
  return (
    <>
      <a href={github} target="_blank" rel="noreferrer" className={linkClass}>
        Open the form on GitHub
        <span className="sr-only"> for {label} (opens in a new tab)</span>
        <ExternalLink aria-hidden="true" className="size-3.5" />
      </a>
      <a href={email} className={linkClass}>
        <Mail aria-hidden="true" className="size-3.5" />
        Email it
        <span className="sr-only"> for {label}</span>
      </a>
    </>
  );
}

/**
 * The Feedback page (ADR 0036): bugs and ideas, each through its own GitHub issue form
 * or an email to T7SEN; wrong game data goes to Help fill in data, with a screenshot.
 * Static: nothing is sent to ArcheLab's own server.
 */
export default function FeedbackPage() {
  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <MessageSquareHeart aria-hidden="true" className="text-primary" />
            Feedback
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Send feedback
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            Found a bug, have an idea, or spotted something that differs from
            the game? Pick what fits below.
          </p>
        </div>
      </section>

      <PageSection
        id="kinds"
        icon={<Send />}
        title="What to send"
        description="Bugs and ideas go on GitHub or by email. Game facts need a screenshot, so they have their own page."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FeedbackCard
            icon={<Bug />}
            title="Report a bug"
            description="Something doesn't work, looks broken or reads wrong on the site. Say which page, and what you saw."
          >
            <SendLinks
              github={bugReportUrl}
              email={bugEmailUrl}
              label="a bug"
            />
          </FeedbackCard>
          <FeedbackCard
            icon={<Lightbulb />}
            title="Suggest an idea"
            description="A tool, a page or a change you'd like, and what it would help you with in the game."
          >
            <SendLinks
              github={suggestionUrl}
              email={suggestionEmailUrl}
              label="an idea"
            />
          </FeedbackCard>
          <FeedbackCard
            icon={<SearchCheck />}
            title="Wrong game data"
            description="A number, name or fact that differs from the game. Send it with a screenshot of what the game shows."
          >
            <Link href="/contribute" className={linkClass}>
              Help fill in data
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </FeedbackCard>
        </div>
      </PageSection>

      <PageSection
        id="how"
        icon={<Mail />}
        title="How it's sent"
        description="Either way, it reaches T7SEN, who runs ArcheLab."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardClass}>
            <h3 className="flex items-center gap-2 font-medium">
              <ExternalLink
                aria-hidden="true"
                className="size-4 text-primary"
              />
              On GitHub
            </h3>
            <p className="text-sm text-muted-foreground">
              Each &quot;Open the form on GitHub&quot; link opens a short form.
              It needs a free GitHub account, and what you send is public in{" "}
              <a
                href={`${repoUrl}/issues`}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                ArcheLab&apos;s issues
              </a>
              .
            </p>
          </div>
          <div id="email" className={`${cardClass} scroll-mt-24`}>
            <h3 className="flex items-center gap-2 font-medium">
              <Mail aria-hidden="true" className="size-4 text-primary" />
              By email
            </h3>
            <p className="text-sm text-muted-foreground">
              No account needed: each &quot;Email it&quot; link starts an email
              to {contactEmail} with a few lines to fill in.
            </p>
          </div>
        </div>
      </PageSection>
    </>
  );
}
