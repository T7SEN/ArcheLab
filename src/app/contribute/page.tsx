import {
  Camera,
  ExternalLink,
  HandHelping,
  Hexagon,
  Mail,
  SearchCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import {
  findingEmailUrl,
  findingReportUrl,
  openChecks,
  repoUrl,
  weaponCoreEmailUrl,
  weaponCoreReportUrl,
} from "@/data/contribute";
import { contactEmail } from "@/data/legal";
import { PageSection } from "@/features/game-data/page-section";
import { ReportLinks } from "@/features/game-data/report-links";
import { fetchWeaponsWithCoreSlots } from "@/lib/nexon/weapon-cores";
import { fetchWeaponSummaries } from "@/lib/nexon/weapon-page";
import { pageMetadata, siteUrl } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/contribute",
  title: "Help fill in data",
  description:
    "Some things only show in game. Check one and send it in with a screenshot to help fill in ArcheLab.",
});

const cardClass = "grid content-start gap-2 rounded-2xl border bg-card/60 p-5";

export default async function ContributePage() {
  // The Ultimate weapons whose core slots aren't known, by weapon type, A–Z (ADR 0028):
  // none on 2026-10-17, since NEXON's `core-slot.json` lists all 43 (ADR 0042).
  const withCoreSlots = await fetchWeaponsWithCoreSlots();
  const weapons = (await fetchWeaponSummaries()).filter(
    (weapon) => weapon.tier === "Tier3" && !withCoreSlots.has(weapon.name),
  );
  const byType = [
    ...weapons
      .reduce((groups, weapon) => {
        groups.set(weapon.type, [...(groups.get(weapon.type) ?? []), weapon]);
        return groups;
      }, new Map<string, typeof weapons>())
      .entries(),
  ]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([type, list]) =>
        [type, [...list].sort((a, b) => a.name.localeCompare(b.name))] as const,
    );

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <HandHelping aria-hidden="true" className="text-primary" />
            From players, for players
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Help fill in data
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            Some things only show in game, and nobody can unlock all of them
            alone. If you can check one below, send it in with a screenshot.
            Once its screenshot is checked, it goes on the site.
          </p>
        </div>
      </section>

      <PageSection
        id="how"
        icon={<SearchCheck />}
        title="How to send it"
        description="Either way, add a screenshot of where the game shows it. Crop out your name if you like."
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
              Each &quot;Report on GitHub&quot; link opens a short form with the
              item already filled in. It needs a free GitHub account, and
              reports are public in{" "}
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
              to {contactEmail} with the item named. Attach the screenshot
              before you send it.
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        id="weapon-cores"
        icon={<Hexagon />}
        title="Weapon core slots"
        description={
          weapons.length === 0
            ? "Every Ultimate weapon has its own five core slots, shown on its page."
            : `${String(weapons.length)} Ultimate weapons still need their five core slots. Every weapon has its own, so each one is checked on its own: its Select Core Slot screen, or a built weapon's tooltip, shows them in order.`
        }
      >
        {weapons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every Ultimate weapon is in. Thank you!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byType.map(([type, list]) => (
              <section
                key={type}
                aria-labelledby={`cores-${type}`}
                className={cardClass}
              >
                <h3 id={`cores-${type}`} className="font-medium">
                  {type}
                </h3>
                <ul className="grid gap-3">
                  {list.map((weapon) => (
                    <li key={weapon.slug} className="grid gap-1">
                      <Link
                        href={`/weapons/${weapon.slug}#core`}
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        {weapon.name}
                      </Link>
                      <ReportLinks
                        github={weaponCoreReportUrl(weapon.name)}
                        email={weaponCoreEmailUrl(weapon.name)}
                        label={`${weapon.name}'s core slots`}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        id="other"
        icon={<Camera />}
        title="Other open checks"
        description="Wording and details the site isn't sure of yet."
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {openChecks.map((check) => (
            <li key={check.topic} className={cardClass}>
              <h3 className="font-medium">{check.topic}</h3>
              <p className="text-sm text-muted-foreground">{check.question}</p>
              <ReportLinks
                github={findingReportUrl(
                  check.topic,
                  `${siteUrl}${check.page}`,
                )}
                email={findingEmailUrl(check.topic)}
                label={check.topic}
              />
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  );
}
