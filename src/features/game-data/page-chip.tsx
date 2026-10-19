import Link from "next/link";
import { sitePages } from "@/data/site-pages";

/**
 * A link to another page, as a chip with that page's navbar icon: the Miscellaneous
 * and Basic Materials pages' links to each other and to the Weapons page (ADR 0050).
 */
export function PageChip({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  const Icon = sitePages.find(
    (page) => page.href === href.split("?").at(0),
  )?.icon;
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex items-center gap-1.5 justify-self-start rounded-full border bg-background/40 px-2.5 py-1 text-sm transition-colors outline-none hover:border-ring/60 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {Icon === undefined ? null : (
        <Icon aria-hidden="true" className="size-4 text-primary" />
      )}
      {children}
    </Link>
  );
}
