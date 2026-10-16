"use client";

import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { PillNav } from "@/components/react-bits/pill-nav";
import { PaletteButton } from "@/features/command-palette/palette-button";
import { sitePages } from "@/data/site-pages";

/**
 * The navbar: ArcheLab's mark, linking home and spinning once on hover, then every page
 * in `sitePages`, with a dot under the current one, then the search button that opens
 * the command palette (ADR 0022).
 */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <PillNav
      layout="split"
      logo={<LogoMark className="text-primary" />}
      logoAlt="ArcheLab"
      trailing={<PaletteButton />}
      // Labels only: the footer shows the pages' icons.
      items={sitePages.map(({ href, label }) => ({ href, label }))}
      activeHref={pathname}
      className="pointer-events-auto"
    />
  );
}
