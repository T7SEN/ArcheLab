import {
  House,
  MessageSquareText,
  Scale,
  ScrollText,
  ShieldCheck,
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
];

/** The legal pages, linked from every page's footer rather than the navbar (ADR 0021). */
export const legalPages: readonly SitePage[] = [
  { href: "/legal", label: "Legal notice", icon: Scale },
  { href: "/privacy", label: "Privacy policy", icon: ShieldCheck },
  { href: "/terms", label: "Terms of use", icon: ScrollText },
];

/** Every page on the site, for the sitemap and the page test. */
export const allPages: readonly SitePage[] = [...sitePages, ...legalPages];
