import Link from "next/link";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/section-header";

/**
 * A Descendant or weapon page's section (ADR 0023, ADR 0024): the site's shared header,
 * and a scroll margin so a section link lands it under the floating navbar.
 */
export function PageSection({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="mx-auto grid max-w-6xl scroll-mt-(--site-header-height) gap-6 px-4 py-10"
    >
      <SectionHeader
        id={`${id}-title`}
        icon={icon}
        title={title}
        description={description}
      />
      {children}
    </section>
  );
}

/**
 * The links under a page's hero, one per section; they glide there (smooth scrolling).
 * They are Next.js links: a plain `#section` anchor adds a history entry the router
 * doesn't know, and Back from the next page then showed the wrong page (2026-10-16).
 */
export function SectionLinks({
  label,
  links,
}: {
  /** The nav's accessible name: "Raven's sections". */
  label: string;
  links: readonly { readonly id: string; readonly label: string }[];
}) {
  return (
    <nav aria-label={label} className="relative mx-auto max-w-6xl px-4 pb-6">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={`#${link.id}`}
              className="inline-flex rounded-full border bg-card/60 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-md transition-colors outline-none hover:border-ring/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
