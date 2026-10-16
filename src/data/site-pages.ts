import {
  Crosshair,
  House,
  MessageSquareText,
  Scale,
  ScrollText,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/** A player-facing page, as the navbar or the footer shows it. */
export interface SitePage {
  href: string;
  label: string;
  /** Shown beside the label in the footer; the navbar shows labels only. */
  icon: LucideIcon;
}

/**
 * The pages in the navbar, in order. The navbar reads this list, and
 * `site-pages.test.ts` fails when a page under `src/app` is in neither this list nor
 * `legalPages`, so a new page cannot ship without its link.
 */
export const sitePages: readonly SitePage[] = [
  { href: "/", label: "Home", icon: House },
  // The chat tool's own icon (`tools.ts`).
  { href: "/tools/chat", label: "Chat builder", icon: MessageSquareText },
  // Every Descendant, with filters (ADR 0023); each one's page is under it.
  { href: "/descendants", label: "Descendants", icon: UsersRound },
  // Every weapon, with filters (ADR 0024); each one's page is under it.
  { href: "/weapons", label: "Weapons", icon: Crosshair },
];

/**
 * The screen width, in px, below which these links fold into the navbar's menu,
 * measured 2026-10-16 (ADR 0010). PillNav measures the fold itself once its script
 * runs; this width folds the first paint before that. A change to `sitePages` moves the
 * fold, and `shell.spec.ts` fails until this matches it again.
 */
export const navbarFoldBelow = 550;

/** The legal pages, linked from every page's footer rather than the navbar (ADR 0021). */
export const legalPages: readonly SitePage[] = [
  { href: "/legal", label: "Legal notice", icon: Scale },
  { href: "/privacy", label: "Privacy policy", icon: ShieldCheck },
  { href: "/terms", label: "Terms of use", icon: ScrollText },
];

/** Every page on the site, for the sitemap and the page test. */
export const allPages: readonly SitePage[] = [...sitePages, ...legalPages];

/**
 * The navbar link a path marks: the page itself, or the section it sits under, as
 * Descendants for `/descendants/raven` (ADR 0023). Home is no page's section. Null for
 * a page outside the navbar.
 */
export function navbarCurrent(
  pathname: string,
): { href: string; page: boolean } | null {
  const page = sitePages.find((item) => item.href === pathname);
  if (page !== undefined) {
    return { href: page.href, page: true };
  }
  const section = sitePages.find(
    (item) => item.href !== "/" && pathname.startsWith(`${item.href}/`),
  );
  return section === undefined ? null : { href: section.href, page: false };
}

/** Every page's address for the sitemap: the listed pages, each Descendant's, each weapon's. */
export function siteHrefs(
  descendantSlugs: readonly string[],
  weaponSlugs: readonly string[],
): string[] {
  return [
    ...allPages.map((page) => page.href),
    ...descendantSlugs.map((slug) => `/descendants/${slug}`),
    ...weaponSlugs.map((slug) => `/weapons/${slug}`),
  ];
}

/**
 * Routes with a dynamic segment, and where their pages come from. `site-pages.test.ts`
 * accepts a dynamic route only when it is listed here; the sitemap and the navbar's
 * index page list the pages themselves.
 */
export const dynamicRoutes: Readonly<Record<string, string>> = {
  // One page per Descendant in NEXON's descendant.json, built at build time (ADR 0023).
  "/descendants/[slug]": "descendant.json",
  // One page per weapon in NEXON's weapon.json, built at build time (ADR 0024).
  "/weapons/[slug]": "weapon.json",
};
