import { Heart, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo-mark";
import {
  footerCommunityHrefs,
  footerDatabaseHrefs,
  footerToolHrefs,
  legalPages,
  sitePages,
  type SitePage,
} from "@/data/site-pages";
import { tools } from "@/data/tools";

/**
 * The footer line, T7SEN's words of 2026-10-15 shortened at T7SEN's request
 * (2026-10-17). It carries the fan-site disclaimer. "love" shows as a drawn heart in
 * the site's violet, and screen readers still read the word.
 */
export const footerText =
  "Made with love by T7SEN. © 2026 ArcheLab, a fan site not affiliated with Nexon.";
const loveWord = "love";

/**
 * Required on every page: NEXON's API terms ask sites to name Nexon as the data source
 * (§8.4), and the builder shows NEXON portraits (AGENTS.md critical rule 3).
 */
export const attributionText = "Data based on NEXON Open API.";

/** The attribution's link: "NEXON Open API" in it opens NEXON's API site (T7SEN, 2026-10-17). */
const apiName = "NEXON Open API";
const apiUrl = "https://openapi.nexon.com/";

const linkClass =
  "inline-flex items-start gap-2 rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * A footer link's icon: the link's own color, so it lights up with the label. It sits on
 * the label's first line (16px icon, 20px line) when a narrow column wraps the label.
 */
function LinkIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />;
}

/** The pages of `sitePages` at `hrefs`, in that order. */
const pagesAt = (hrefs: readonly string[]): SitePage[] =>
  hrefs.flatMap((href) => {
    const page = sitePages.find((entry) => entry.href === href);
    return page === undefined ? [] : [page];
  });

const toolPages = pagesAt(footerToolHrefs);
const databasePages = pagesAt(footerDatabaseHrefs);
const communityPages = pagesAt(footerCommunityHrefs);
const liveTools = tools.filter((tool) => tool.status === "live");
const comingTools = tools.filter((tool) => tool.status !== "live");

/** A page's link in a footer column, with its icon. */
function PageLink({ page }: { page: SitePage }) {
  return (
    <li>
      <Link href={page.href} prefetch={page.prefetch} className={linkClass}>
        <LinkIcon icon={page.icon} />
        {page.label}
      </Link>
    </li>
  );
}

/**
 * Every page's footer (ADR 0018): ArcheLab's mark and a line, then Tools (the live
 * tools, the database, then the coming ones), the main database indexes, Community and
 * the legal pages (ADR 0021), then T7SEN's line and NEXON's attribution, whose "NEXON
 * Open API" links NEXON's API site (T7SEN, 2026-10-17).
 */
export function SiteFooter() {
  const [beforeApi, afterApi] = attributionText.split(apiName);
  const [beforeLove, afterLove] = footerText.split(loveWord);
  return (
    <footer className="border-t bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <div className="grid content-start gap-2 sm:col-span-2 lg:col-span-1">
          <p className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-wide">
            <LogoMark className="h-6 w-auto text-primary" />
            ArcheLab
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {/* No "built on NEXON's game data": only the attribution names NEXON
                (AGENTS.md; T7SEN, 2026-10-17). */}
            Player tools and game data for The First Descendant.
          </p>
        </div>
        <FooterColumn title="Tools">
          {liveTools.map((tool) => (
            <li key={tool.slug}>
              <Link href={tool.href} className={linkClass}>
                <LinkIcon icon={tool.icon} />
                {tool.name}
              </Link>
            </li>
          ))}
          {toolPages.map((page) => (
            <PageLink key={page.href} page={page} />
          ))}
          {comingTools.map((tool) => (
            <li key={tool.slug}>
              <span className="inline-flex items-start gap-2 text-muted-foreground">
                <LinkIcon icon={tool.icon} />
                <span>
                  {tool.name} <span className="text-xs text-primary">Soon</span>
                </span>
              </span>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Database">
          {databasePages.map((page) => (
            <PageLink key={page.href} page={page} />
          ))}
        </FooterColumn>
        <FooterColumn title="Community">
          {communityPages.map((page) => (
            <PageLink key={page.href} page={page} />
          ))}
        </FooterColumn>
        <FooterColumn title="Legal">
          {legalPages.map((page) => (
            <PageLink key={page.href} page={page} />
          ))}
        </FooterColumn>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p>
            {beforeLove}
            <Heart
              aria-hidden="true"
              className="inline size-3.5 fill-primary align-[-0.125em] text-primary"
            />
            <span className="sr-only">{loveWord}</span>
            {afterLove}
          </p>
          <p className="text-xs">
            {beforeApi}
            <a
              href={apiUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm underline decoration-muted-foreground/50 underline-offset-2 transition-colors outline-none hover:text-foreground hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {apiName}
            </a>
            {afterApi}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={title} className="grid content-start gap-3">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="grid gap-2 text-sm">{children}</ul>
    </nav>
  );
}
