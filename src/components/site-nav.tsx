"use client";

import { usePathname } from "next/navigation";
import { PillNav } from "@/components/react-bits/pill-nav";
import { sitePages } from "@/data/site-pages";

/** The navbar: every page in `sitePages`, with a dot under the current one. */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <PillNav
      layout="split"
      logo={
        <span className="font-display text-xl font-semibold tracking-wide">
          ArcheLab
        </span>
      }
      items={[...sitePages]}
      activeHref={pathname}
      className="pointer-events-auto"
    />
  );
}
