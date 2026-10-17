import {
  Motorbike,
  CircuitBoard,
  Database,
  Dna,
  HandHelping,
  History,
  Info,
  Cpu,
  Crosshair,
  Hexagon,
  House,
  MessageSquareHeart,
  MessageSquareText,
  PackageOpen,
  PawPrint,
  Shirt,
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
  /** Shown beside the label in the footer and in a navbar group's menu. */
  icon: LucideIcon;
  /**
   * False for a page too heavy to prefetch from every page's navbar and footer: the
   * modules index's data is about 35 KB compressed, 368 KB to parse (ADR 0025), and the
   * Cosmetics and Amorphous Materials indexes' more (ADR 0039, ADR 0041).
   */
  prefetch?: false;
  /**
   * The navbar button the page sits under, in its menu, instead of a link of its own
   * (ADR 0027). The footer lists every page either way.
   */
  group?: "Database";
  /** Kept out of the navbar: the footer links it (ADR 0028). */
  footerOnly?: true;
  /**
   * False for a page the navbar leaves out with no footer link of its own: Home, which
   * the navbar's logo links (T7SEN, 2026-10-17).
   */
  navbar?: false;
}

/**
 * The pages in the navbar, in order. The navbar reads this list, and
 * `site-pages.test.ts` fails when a page under `src/app` is in neither this list nor
 * `legalPages`, so a new page cannot ship without its link.
 */
export const sitePages: readonly SitePage[] = [
  // Out of the navbar: its logo links home (T7SEN, 2026-10-17). The palette and the
  // sitemap still list it.
  { href: "/", label: "Home", icon: House, navbar: false },
  // The chat tool's own icon (`tools.ts`).
  { href: "/tools/chat", label: "Chat builder", icon: MessageSquareText },
  // The game's items, under the navbar's Database button (ADR 0027).
  // The database's own page: a search over every item and a card per category. Named
  // as its group, it is the page the Database button opens (T7SEN, 2026-10-17;
  // ADR 0034).
  { href: "/database", label: "Database", icon: Database, group: "Database" },
  // Every Descendant, with filters (ADR 0023); each one's page is under it.
  {
    href: "/descendants",
    label: "Descendants",
    icon: UsersRound,
    group: "Database",
  },
  // Every weapon, with filters (ADR 0024); each one's page is under it.
  { href: "/weapons", label: "Weapons", icon: Crosshair, group: "Database" },
  // Every module, with filters; each opens in the index's grid (ADR 0025).
  {
    href: "/modules",
    label: "Modules",
    icon: Cpu,
    prefetch: false,
    group: "Database",
  },
  // Every reactor, with filters; each opens in the index's grid (ADR 0026).
  { href: "/reactors", label: "Reactors", icon: Hexagon, group: "Database" },
  // Every external component set, with filters; each opens in the index's grid
  // (ADR 0027).
  {
    href: "/external-components",
    label: "External Components",
    icon: CircuitBoard,
    group: "Database",
  },
  // Every Fellow; each opens in the index's grid (T7SEN, 2026-10-17; ADR 0035).
  { href: "/fellows", label: "Fellows", icon: PawPrint, group: "Database" },
  // Every vehicle; each opens in the index's grid (T7SEN, 2026-10-17; ADR 0037).
  { href: "/vehicles", label: "Vehicles", icon: Motorbike, group: "Database" },
  // Every Mutant Cell, from the update notes; each opens in the index's grid (T7SEN,
  // 2026-10-17; ADR 0038).
  {
    href: "/mutant-cells",
    label: "Mutant Cells",
    icon: Dna,
    group: "Database",
  },
  // Every cosmetic, one card per cosmetic; each opens in the index's grid (T7SEN,
  // 2026-10-17; ADR 0039).
  {
    href: "/cosmetics",
    label: "Cosmetics",
    icon: Shirt,
    prefetch: false,
    group: "Database",
  },
  // Every Amorphous Material Pattern and what it opens into; each opens in the index's
  // grid (T7SEN, 2026-10-17; ADR 0041).
  {
    href: "/amorphous-materials",
    label: "Amorphous Materials",
    icon: PackageOpen,
    prefetch: false,
    group: "Database",
  },
  // What players can check in game and send in (ADR 0028), in the footer's Community
  // column, not the navbar.
  {
    href: "/contribute",
    label: "Help fill in data",
    icon: HandHelping,
    footerOnly: true,
  },
  // What ArcheLab is and how its facts are kept right; what changed on the site; where
  // to send bugs and ideas. In the footer's Community column (T7SEN, 2026-10-17; ADR
  // 0036).
  { href: "/about", label: "About", icon: Info, footerOnly: true },
  { href: "/changelog", label: "Changelog", icon: History, footerOnly: true },
  {
    href: "/feedback",
    label: "Feedback",
    icon: MessageSquareHeart,
    footerOnly: true,
  },
];

/**
 * The footer's Database column, in order: the main indexes only (T7SEN, 2026-10-17).
 * The other pages are in the navbar, the palette and the sitemap.
 */
export const footerDatabaseHrefs: readonly string[] = [
  "/descendants",
  "/weapons",
  "/modules",
];

/** Pages the footer lists under Tools, after the live tools: the database (T7SEN). */
export const footerToolHrefs: readonly string[] = ["/database"];

/**
 * The footer's Community column (T7SEN, 2026-10-17): About, Changelog, Feedback and
 * Help fill in data (ADR 0028, ADR 0036).
 */
export const footerCommunityHrefs: readonly string[] = [
  "/about",
  "/changelog",
  "/feedback",
  "/contribute",
];

/** A navbar entry: a page's link, or a group's button over its pages' links. */
export type NavbarEntry =
  | { readonly page: SitePage }
  | {
      readonly group: string;
      readonly pages: readonly SitePage[];
      /** The group's own page, named as the group, which its button opens. */
      readonly home?: SitePage;
    };

/**
 * The navbar's entries in `sitePages` order: a page with a group joins its group's
 * button, which takes the place of the group's first page (ADR 0027). A page named as
 * its group is the group's `home` (ADR 0034), and stays among its pages.
 */
export function navbarEntries(
  pages: readonly SitePage[] = sitePages,
): NavbarEntry[] {
  const entries: NavbarEntry[] = [];
  const groups = new Map<string, SitePage[]>();
  for (const page of pages) {
    if (page.footerOnly === true || page.navbar === false) {
      continue;
    }
    if (page.group === undefined) {
      entries.push({ page });
      continue;
    }
    const members = groups.get(page.group);
    if (members === undefined) {
      const first = [page];
      groups.set(page.group, first);
      entries.push({ group: page.group, pages: first });
    } else {
      members.push(page);
    }
  }
  return entries.map((entry) => {
    if ("page" in entry) {
      return entry;
    }
    const home = entry.pages.find((page) => page.label === entry.group);
    return home === undefined ? entry : { ...entry, home };
  });
}

/**
 * The screen width, in px, below which these links fold into the navbar's menu (ADR
 * 0010). PillNav measures the fold itself once its script runs; this width folds the
 * first paint before that. Labels draw wider on Linux than on Windows, so the fold
 * moves with the system's fonts: this is CI's (Linux), worked out on 2026-10-17 without
 * Home from CI's label widths (the bar needs 351px there, 342px on Windows, where it
 * fits from 374px). On Windows a screen 374 to 382px wide paints folded and unfolds once
 * measured; folding early never overflows. A change to `sitePages` moves the fold, and
 * `shell.spec.ts` fails in CI until this matches it again.
 */
export const navbarFoldBelow = 383;

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
