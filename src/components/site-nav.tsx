"use client";

import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { PillNav, type PillNavItem } from "@/components/react-bits/pill-nav";
import { PaletteButton } from "@/features/command-palette/palette-button";
import {
  navbarCurrent,
  navbarEntries,
  navbarFoldBelow,
} from "@/data/site-pages";

/**
 * The navbar's items: a link per page, and the Database button over the game's items
 * (ADR 0027), which opens the database page; its menu opens on hover (ADR 0034), its
 * pages under their sections' headings (T7SEN, 2026-10-19). Bar links show labels only,
 * as the footer shows the pages' icons; the Database menu shows them.
 */
const items: PillNavItem[] = navbarEntries().map((entry) =>
  "page" in entry
    ? {
        href: entry.page.href,
        label: entry.page.label,
        prefetch: entry.page.prefetch,
      }
    : {
        label: entry.group,
        href: entry.home?.href,
        prefetch: entry.home?.prefetch,
        links: entry.pages.map(
          ({ href, label, icon: Icon, prefetch, section }) => ({
            href,
            label,
            prefetch,
            section,
            icon: <Icon aria-hidden="true" />,
          }),
        ),
      },
);

/**
 * The navbar: ArcheLab's mark, linking home and spinning once on hover (there is no Home
 * link; T7SEN, 2026-10-17), then the pages `navbarEntries` keeps, with a dot under the
 * current one or under the section the page sits in (Descendants on a Descendant's
 * page, ADR 0023), then the search button that opens the command palette (ADR 0022).
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
      items={items}
      // A path outside the navbar matches no link, so nothing is marked.
      activeHref={current?.href ?? pathname}
      activeKind={current?.page === false ? "section" : "page"}
      // Folds the first paint on phones, before PillNav measures (ADR 0010).
      foldBelow={navbarFoldBelow}
      className="pointer-events-auto"
    />
  );
}
