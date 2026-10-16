"use client";

import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { PillNav } from "@/components/react-bits/pill-nav";
import { PaletteButton } from "@/features/command-palette/palette-button";
import { navbarCurrent, navbarFoldBelow, sitePages } from "@/data/site-pages";

/**
 * The navbar: ArcheLab's mark, linking home and spinning once on hover, then every page
 * in `sitePages`, with a dot under the current one or under the section the page sits
 * in (Descendants on a Descendant's page, ADR 0023), then the search button that opens
 * the command palette (ADR 0022).
 */
export function SiteNav() {
  const pathname = usePathname();
  const current = navbarCurrent(pathname);
  return (
    <PillNav
      layout="split"
      logo={<LogoMark className="text-primary" />}
      logoAlt="ArcheLab"
      trailing={<PaletteButton />}
      // Labels only: the footer shows the pages' icons.
      items={sitePages.map(({ href, label }) => ({ href, label }))}
      // A path outside the navbar matches no link, so nothing is marked.
      activeHref={current?.href ?? pathname}
      activeKind={current?.page === false ? "section" : "page"}
      // Folds the first paint on phones, before PillNav measures (ADR 0010).
      foldBelow={navbarFoldBelow}
      className="pointer-events-auto"
    />
  );
}
