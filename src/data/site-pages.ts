/** A player-facing page, as the navbar or the footer shows it. */
export interface SitePage {
  href: string;
  label: string;
}

/**
 * The pages in the navbar, in order. The navbar reads this list, and
 * `site-pages.test.ts` fails when a page under `src/app` is in neither this list nor
 * `legalPages`, so a new page cannot ship without its link.
 */
export const sitePages: readonly SitePage[] = [
  { href: "/", label: "Home" },
  { href: "/tools/chat", label: "Chat builder" },
];

/** The legal pages, linked from every page's footer rather than the navbar (ADR 0021). */
export const legalPages: readonly SitePage[] = [
  { href: "/legal", label: "Legal notice" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
];

/** Every page on the site, for the sitemap and the page test. */
export const allPages: readonly SitePage[] = [...sitePages, ...legalPages];
