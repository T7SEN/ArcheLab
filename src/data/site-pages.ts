/** A player-facing page, as the navbar shows it. */
export interface SitePage {
  href: string;
  label: string;
}

/**
 * Every player-facing page, in navbar order. The navbar reads this list, and
 * `site-pages.test.ts` fails when a page under `src/app` is missing from it, so a
 * new page cannot ship without its navbar link.
 */
export const sitePages: readonly SitePage[] = [
  { href: "/", label: "Home" },
  { href: "/tools/chat", label: "Chat builder" },
];
