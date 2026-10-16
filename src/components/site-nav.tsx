"use client";

import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { PillNav } from "@/components/react-bits/pill-nav";
import { sitePages } from "@/data/site-pages";

/**
 * The navbar: ArcheLab's mark, linking home and spinning once on hover, then every page
 * in `sitePages`, with a dot under the current one.
 */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <PillNav
      layout="split"
      logo={<LogoMark className="text-primary" />}
      logoAlt="ArcheLab"
      items={[...sitePages]}
      activeHref={pathname}
      className="pointer-events-auto"
    />
  );
}
