import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo-mark";
import { legalPages, sitePages } from "@/data/site-pages";
import { tools } from "@/data/tools";

/** The footer line, in T7SEN's words (2026-10-15). It carries the fan-site disclaimer. */
export const footerText =
  "Made with ❤️ by T7SEN. © 2026 ArcheLab - ArcheLab is a community fan site and is not affiliated with Nexon.";

/**
 * Required on every page: NEXON's API terms ask sites to name Nexon as the data source
 * (§8.4), and the builder shows NEXON portraits (AGENTS.md critical rule 3).
 */
export const attributionText = "Data based on NEXON Open API.";

const linkClass =
  "rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Every page's footer (ADR 0018): ArcheLab's mark and a line, a sitemap from the tool registry,
 * the navbar's page list and the legal pages (ADR 0021), then T7SEN's line and NEXON's
 * attribution.
 */
export function SiteFooter() {
  return (
    <footer className="border-t bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <div className="grid content-start gap-2 sm:col-span-2 lg:col-span-1">
          <p className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-wide">
            <LogoMark className="h-6 w-auto text-primary" />
            ArcheLab
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Fan-made tools for The First Descendant, built on NEXON&apos;s game
            data.
          </p>
        </div>
        <FooterColumn title="Tools">
          {tools.map((tool) => (
            <li key={tool.slug}>
              {tool.status === "live" ? (
                <Link href={tool.href} className={linkClass}>
                  {tool.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">
                  {tool.name} <span className="text-xs text-primary">soon</span>
                </span>
              )}
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Site">
          {sitePages.map((page) => (
            <li key={page.href}>
              <Link href={page.href} className={linkClass}>
                {page.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Legal">
          {legalPages.map((page) => (
            <li key={page.href}>
              <Link href={page.href} className={linkClass}>
                {page.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Data">
          <li>
            <a
              href="https://openapi.nexon.com/"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              NEXON Open API
            </a>
          </li>
        </FooterColumn>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p>{footerText}</p>
          <p className="text-xs">{attributionText}</p>
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
